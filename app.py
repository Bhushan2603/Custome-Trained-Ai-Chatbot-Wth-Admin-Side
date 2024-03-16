from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, OpenAI
from langchain.chains.question_answering import load_qa_chain 
from dotenv import load_dotenv
import os
import PyPDF2
import traceback
import sqlite3
from datetime import datetime 
import requests
from bs4 import BeautifulSoup

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'
# Define the path to your SQLite database file
DATABASE = "chatbot.db"

conversation_history = []

# Function to create database tables
def create_tables():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Create User table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Create Conversation table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Conversation (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(id)
        )
        """
    )

    # Create Message table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Message (
            id INTEGER PRIMARY KEY,
            conversation_id INTEGER,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            is_bot_message INTEGER DEFAULT 0,
            FOREIGN KEY (conversation_id) REFERENCES Conversation(id),
            FOREIGN KEY (user_id) REFERENCES User(id)
        )
        """
    ) 


    conn.commit()
    conn.close()

# Call the function to create the tables
create_tables()

def create_admin_table():
    conn = sqlite3.connect('chatbot.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY,
            adminname TEXT UNIQUE,
            password TEXT
        )
    ''')
    conn.commit()
    conn.close()


# Function to get admin by adminname
def get_admin(adminname,password):
    conn = sqlite3.connect('chatbot.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM admin WHERE adminname = ? and password = ?', (adminname, password))
    admin = cursor.fetchall()
    conn.close()
    return admin


#all 3 pages here 

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chatbot-admin')
def admin():
 
        return render_template('admin.html')
    
@app.route('/admin-dashboard')
def admin_dashboard():
    if 'logged_in' in session:
        return render_template('admin-dashboard.html')
    else:
        return redirect(url_for('admin'))  # Redirect to admin login if not logged in


#login functionality 
@app.route('/admin-login', methods=['POST'])
def admin_login():
    username = request.form.get('username')
    password = request.form.get('password')

    admin = get_admin(username,password)
    if len(admin)>0:
            session['logged_in'] = True
            return redirect(url_for('admin_dashboard')) 
    else:
        return jsonify({'error': 'Unauthorized'}), 401 
        

        

# Flask route to fetch usernames from the database
@app.route('/get_usernames', methods=['GET'])
def get_usernames():
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM User")
        usernames = cursor.fetchall()
        conn.close()
        return jsonify(usernames)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Flask route to fetch conversation for a specific user
@app.route('/get_conversation', methods=['POST'])
def get_conversation():
    try:
        data = request.get_json()
        user_id = data.get('user_id')  # Get user ID from the request data\
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Message WHERE user_id=?", (user_id,))
        conversation = cursor.fetchall()  # Fetch all messages for the user
        conn.close()
        print(conversation)
        return jsonify(conversation)
    except Exception as e:
        traceback_str = traceback.format_exc()  # Get the traceback as a string
        app.logger.error(f"An error occurred: {traceback_str}")
        return jsonify({'error': str(e)}), 500




#This is for upload file into static folder ------------------        
UPLOAD_FOLDER = 'static'
ALLOWED_EXTENSIONS = {'pdf', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():

    if 'logged_in' in session:
        if 'file' not in request.files:
            return 'No file part'

        file = request.files['file']

        if file.filename == '':
            return 'No selected file'

        if file and allowed_file(file.filename):
            filename = 'data.' + file.filename.rsplit('.', 1)[1].lower()  # Rename to data.txt or data.pdf
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return 'File uploaded successfully'
        else:
            return 'Invalid file format. Only PDF or TXT files are allowed.'
    else:
        return redirect(url_for('admin'))  
    
    
#file upload ends



#username details store on database from here
@app.route('/username', methods=['POST'])
def username():
    try:
        # Get username from the request form data
        username = request.form.get('username')

        # Check if the username already exists in the database
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM User WHERE username = ?", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            # If the user doesn't exist, insert them into the User table
            current_datetime = datetime.now()
            formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
            # If the user already exists, retrieve their user ID
            user_id = existing_user[0]

            cursor.execute(
                """
                INSERT INTO Conversation (user_id, timestamp) VALUES (?, ?)
                """,
                (user_id, formatted_datetime)
            )
            conn.commit()

            conversation_id = cursor.lastrowid
        else:
            # If the user doesn't exist, insert them into the User table
            current_datetime = datetime.now()
            formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute(
                """
                INSERT INTO User (username, created_at) VALUES (?, ?)
                """,
                (username, formatted_datetime)
            )
            conn.commit()

            # Get the ID of the inserted user
            user_id = cursor.lastrowid

            # Insert a new conversation entry for the user
            cursor.execute(
                """
                INSERT INTO Conversation (user_id, timestamp) VALUES (?, ?)
                """,
                (user_id, formatted_datetime)
            )
            conversation_id = cursor.lastrowid

            # Commit the changes
            conn.commit()

        conn.close()

        # Store user ID and conversation ID in session
        session['user_id'] = user_id
        session['conversation_id'] = conversation_id
        return username
    except Exception as e:
        # Handle any exceptions
        print("An error occurred:", str(e))
        return "Error occurred while saving the username", 500


#main functionality of chatbot 
@app.route('/chatbot', methods=['POST'])
def chatbot():
    try:

        user_id = session.get('user_id')  # Retrieve user ID from session
        conversation_id = session.get('conversation_id')  # Retrieve conversation ID from session
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        # Get the API key from the environment variable
        openai_api_key = os.getenv("OPENAI_API_KEY")

        # Read text from the text file
        text_file_path = os.path.join('static', 'data.txt')
        pdf_path = os.path.join('static', 'data.pdf')

        concatenated_text = ""

        # Read text from the text file
        if os.path.exists(text_file_path):
            with open(text_file_path, 'r') as file:
                concatenated_text += file.read()

        # Read text from the PDF file
        if os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    content = page.extract_text()
                    if content:
                        concatenated_text += content


        url = 'http://127.0.0.1:5000/'  # Replace this with the URL of the website you want to scrape
        response = requests.get(url)
        html_content = response.content
        soup = BeautifulSoup(html_content, 'html.parser')

        # Extract text from all HTML tags on the webpage
        for tag in soup.find_all():
            if tag.text.strip():  # Check if the tag has non-empty text content
                concatenated_text += tag.text.strip() + '\n'

        if concatenated_text:
            # Use LangChain's updated modules and functions
            text_splitter = CharacterTextSplitter(
                separator="\n",
                chunk_size=800,
                chunk_overlap=200,
                length_function=len,
            )

            texts = text_splitter.split_text(concatenated_text)

            embeddings = OpenAIEmbeddings(api_key=openai_api_key)
            document_search = FAISS.from_texts(texts, embeddings)

            chain = load_qa_chain(OpenAI(api_key=openai_api_key), chain_type="stuff")

            query = request.form.get('question')

            if query:
                is_bot_message = 0
                cursor.execute(
                    """
                    INSERT INTO Message (content, user_id, conversation_id, is_bot_message) VALUES (?, ?, ?, ?)
                    """,
                    (query, user_id, conversation_id, is_bot_message)
                )
                conn.commit()
            

            last_chatbot_response = conversation_history[-1]["content"] if conversation_history else ""
            concatenated_sentence = f"{last_chatbot_response} {query}"

            docs = document_search.similarity_search(concatenated_sentence)
            result = chain.run(input_documents=docs, question=concatenated_sentence)

            # Store message in the Message table
            if result:
                is_bot_message = 1
                cursor.execute(
                    """
                    INSERT INTO Message (content, user_id, conversation_id, is_bot_message) VALUES (?, ?, ?, ?)
                    """,
                    (result, user_id, conversation_id, is_bot_message)
                )
            conn.commit()
            conn.close()

            return result
        else:
            return "No content found in text or PDF document."

    except Exception as e:
        error_message = "System is on maintenance. Please wait for a minute. Sorry for your inconvenience."
        traceback_str = traceback.format_exc()  # Get the traceback as a string
        app.logger.error(f"An error occurred: {error_message}\n{traceback_str}")
        return error_message


# Route to analytics page  
@app.route('/metrics')
def get_metrics():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    print("start_date",start_date)
    print("end_date",end_date)

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Total Users
    cursor.execute("SELECT COUNT(DISTINCT id) FROM User")
    total_users = cursor.fetchone()[0]

    # New Users
    cursor.execute("SELECT COUNT(DISTINCT id) FROM User WHERE created_at BETWEEN ? AND ?", (start_date, end_date))
    new_users = cursor.fetchone()[0]

    # Returning Users
    cursor.execute("SELECT COUNT(DISTINCT id) FROM User WHERE id NOT IN (SELECT DISTINCT id FROM User WHERE created_at <= ?) AND id IN (SELECT DISTINCT user_id FROM Conversation WHERE timestamp BETWEEN ? AND ?)", (start_date, start_date, end_date))
    returning_users = cursor.fetchone()[0]

    # Sessions
    cursor.execute("SELECT COUNT(DISTINCT id) FROM Conversation WHERE timestamp BETWEEN ? AND ?", (start_date, end_date))
    sessions = cursor.fetchone()[0]

    # Total Messages
    cursor.execute("SELECT COUNT(*) FROM Message WHERE timestamp BETWEEN ? AND ?", (start_date, end_date))
    total_messages = cursor.fetchone()[0]

        # Fetch data for the graph
    # Fetch data for the graph
    cursor.execute("""
        SELECT DATE(timestamp) AS date, COUNT(id) AS sessions 
        FROM Conversation 
        WHERE DATE(timestamp) BETWEEN ? AND ? 
        GROUP BY DATE(timestamp)""", (start_date, end_date))
    sessions_data = cursor.fetchall()

    cursor.execute("""
        SELECT DATE(created_at) AS date, COUNT(id) AS new_users 
        FROM User 
        WHERE DATE(created_at) BETWEEN ? AND ? 
        GROUP BY DATE(created_at)""", (start_date, end_date))
    new_users_data = cursor.fetchall()

    cursor.execute("""
        SELECT DATE(timestamp) AS date, COUNT(id) AS total_messages 
        FROM Message 
        WHERE DATE(timestamp) BETWEEN ? AND ? 
        GROUP BY DATE(timestamp)""", (start_date, end_date))
    total_messages_data = cursor.fetchall()



    conn.close()
    print(sessions_data)
    print(new_users_data)
    print(total_messages_data)
    # Return the metrics and graph data as JSON
    return jsonify({
        "total_users": total_users,
        "new_users": new_users,
        "returning_users": returning_users,
        "sessions": sessions,
        "total_messages": total_messages,
        "sessions_data": sessions_data,
        "new_users_data": new_users_data,
        "total_messages_data": total_messages_data
    })

@app.route('/logout', methods=['POST'])
def logout():
    # Remove session variables
    session.pop('logged_in', None)

    # Redirect to the admin login page
    return "redirect(url_for('admin'))"




if __name__ == '__main__':
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.run()
