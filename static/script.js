/* ----- here is the logic to get user name from the username ---------*/ 


document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      document.getElementById('overlay').style.display = 'block';
      document.getElementById('popup').classList.add('active');
    }, 2000); // Show popup after 2 seconds
  });
  
  function saveUsername() {
    var username = document.getElementById('username').value; 

    $.ajax({
        type: 'POST',
        url: '/username',
        data: {
            username: username,
        },
        success: function(response) {
            console.log('Username has been save:', username);
            
        },
        error: function(error) {
            console.log(error);
        }
    });
    // You can store the username in a variable or send it to the server for further processing
    // For now, let's just close the popup
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').classList.remove('active');

  }
  
  /* ----- here is the logic of chatbot ---------*/ 


$(document).ready(function() {

    let chatWindowOpen = false;
    const chatWindow = $("#chat-container");
  
    // Toggle chat window
    function toggleChat() {
      chatWindowOpen = !chatWindowOpen;
      if (chatWindowOpen) {
        chatWindow.slideDown();
      } else {
        chatWindow.slideUp();
      }
    }
  
    // Click event for the chat icon
    $("#chat-icon").click(function() {
      toggleChat();
    });


    // Function to handle form submission
    // JavaScript to handle scrolling on button click
    const messagesContainer = document.getElementById('chat-messages');

    function submitQuestion() {
        var question = $('#question').val().trim();
        if (question !== '') {
            
            $('#chat-messages').append('<p class="self-content">' + question + '</p><br>');
            $('#question').val('');
            $('#chat-messages').append('<p class="typing bot-content">typing...</p>');

            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom on button click

            $.ajax({
                type: 'POST',
                url: '/chatbot',
                data: {
                    question: question,
                },
                success: function(response) {
                    $('#chat-messages').find('.typing').remove();     
                    $('#chat-messages').append('<p class="bot-content">' + response + '</p>');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom on button click

                },
                error: function(error) {
                    console.log(error);
                }
            });
        }
    }

    // Click event for the ask button
    $('#ask-btn').click(function() {
        submitQuestion();
    });

    // Keydown event for the input field
    $('#question').keydown(function(event) {
        // Check if the Enter key (key code 13) is pressed
        if (event.keyCode === 13) {
            event.preventDefault(); // Prevent form submission to avoid page reload
            submitQuestion();
        }
    });

    function scrollToBottom() {
        // After updating the chat messages, update the SimpleBar instance
        var chatContainer = document.getElementById('chat-container');
        var simpleBarInstance = new SimpleBar(chatContainer);
        var scrollElement = simpleBarInstance.getScrollElement();
        scrollElement.scrollTop = scrollElement.scrollHeight;
    }
    
});
