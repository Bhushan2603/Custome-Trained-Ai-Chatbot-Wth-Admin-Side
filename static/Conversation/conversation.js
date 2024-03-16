$(document).ready(function() {
    // Function to fetch conversation and render it in the chat section
    function fetchAndRenderConversation(userId) {
        $.ajax({
            url: '/get_conversation',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ user_id: userId }),
            success: function(response) {
                $('#chatSection').empty(); // Clear previous conversation
                if (response == '') {
                    $('#chatSection').append("<div class='empty'>This User doesn't have any Conversation History!!</div>");
                } else {
                    response.forEach(function(message) {
                        if (message[5] === 0) {
                            // User message
                            $('#chatSection').append('<div class="chat-message sender">' + message[2] + '</div>');
                        } else {
                            // Bot message
                            $('#chatSection').append('<div class="chat-message receiver">' + message[2] + '</div>');
                        }
                    });
                }
            },
            error: function(error) {
                console.error('Error fetching conversation:', error);
            }
        });
    }

    // Fetch usernames and user IDs from the server
    $.ajax({
        url: '/get_usernames',
        type: 'GET',
        success: function(response) {
            // Render usernames dynamically in both list and select tag
            $('.user-list').empty(); // Clear previous entries
            $('.user-dropdown').empty();
            response.forEach(function(user) {
                // For list
                var listItem = $('<li>').text(user[1]);
                listItem.data('user-id', user[0]);
                $('.user-list').append(listItem);

                // For select tag
                var option = $('<option>').text(user[1]);
                option.attr('value', user[0]);
                $('.user-dropdown').append(option);
            });

            // Add click event listener to list items
            $('.user-list li').click(function() {
                var selectedUserId = $(this).data('user-id');
                fetchAndRenderConversation(selectedUserId);
            });

            // Add change event listener to select tag
            $('.user-dropdown').change(function() {
                var selectedUserId = $(this).val();
                fetchAndRenderConversation(selectedUserId);
            });
        },
        error: function(error) {
            console.error('Error fetching usernames:', error);
        }
    });
    
    // Add 'active' class to the clicked user list item
    $('.user-list li').click(function() {
        $('.user-list li').removeClass('active');
        $(this).addClass('active');
    });
});
