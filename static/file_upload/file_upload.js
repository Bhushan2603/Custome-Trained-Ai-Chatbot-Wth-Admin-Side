const droppable = document.querySelector(".droppable");
const list = document.querySelector(".list");
const ball = document.querySelector(".ball");
const filledBall = document.querySelector(".filled-ball");
const hand = document.querySelector(".hand");
const fileInput = document.getElementById("fileInput");

const reader = new FileReader();

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};

let isDragging = 0;

document.addEventListener("dragover", e => {
  e.preventDefault();
  isDragging++;
  if (isDragging === 1) droppable.classList.add("is-dragging");
});

document.addEventListener("drop", e => {
  e.preventDefault();
  isDragging = 0;
  droppable.classList.remove("is-dragging");
});

list.addEventListener("dragover", e => {
  e.preventDefault();
});

const dragtl = gsap.timeline({ paused: true });

dragtl
  .to(
    ball,
    { duration: 0.4, translateX: "286px", autoAlpha: 1, translateY: "-230px" },
    "drag"
  )
  .to(
    hand,
    {
      duration: 0.4,
      transformOrigin: "right",
      rotate: "66deg",
      translateY: "70px",
      translateX: "-20px"
    },
    "drag"
  );

list.addEventListener("dragenter", e => {
  e.preventDefault();
  droppable.classList.add("is-over");
  dragtl.play();
});

list.addEventListener("dragleave", e => {
  e.preventDefault();
  droppable.classList.remove("is-over");
  dragtl.reverse();
});

list.addEventListener("drop", e => {
  e.preventDefault();
  let sadly = 0;
  const { offsetX, offsetY } = e;
  const { files } = e.dataTransfer;
  reader.readAsDataURL(files[0]);

  reader.addEventListener("load", () => {
    sadly++;
    if (sadly > 1) return;
    itemMarkup(files[0], reader.result, offsetX, offsetY);
    
    // Send file to Flask backend via AJAX
    const formData = new FormData();
    formData.append('file', files[0]);

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      $('div.list').append('<h4 class="Statusmsg">'+ data +'</h4>');
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
    });
  });

  droppable.classList.remove("is-over");
});

const itemMarkup = (file, url, x, y) => {
  const item = document.createElement("div");
  const id = Math.random()
    .toString(36)
    .substr(2, 9);

  item.classList.add("item");
  item.setAttribute("id", id);
  item.innerHTML = `
    <div class="item-img">
      <img src="${url}" />
    </div>
    <div class="item-details">
      <div class="item-name">${file.name}</div>
      <div class="item-size">SIZE: ${formatBytes(file.size)}</div>
    </div>
    <button class="item-delete" data-id="${id}"></button>
`;

  list.append(item);

  const itemDeleteBtn = item.querySelector(".item-delete");
  itemDeleteBtn.addEventListener("click", e => {
    deleteItem(e);
  });

  const itemImage = item.querySelector(".item-img");
  const imageLeft = itemImage.offsetLeft;
  const imageTop = itemImage.offsetTop;
  const image = document.createElement("div");

  image.classList.add("loaded-image");
  image.innerHTML = `
    <img src="${url}" />
    <span>
      <svg fill="#fff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330">
        <path d="M165 7.5c-8.284 0-15 6.716-15 15v60c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15v-60c0-8.284-6.716-15-15-15z"/>
        <path d="M165 262.5c-8.284 0-15 6.716-15 15v30c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15v-30c0-8.284-6.716-15-15-15z"/>
        <path d="M315 157.5h-60c-8.284 0-15 6.716-15 15s6.716 15 15 15h60c8.284 0 15-6.716 15-15s-6.716-15-15-15z"/>
        <path d="M90 172.5c0-8.284-6.716-15-15-15H15c-8.284 0-15 6.716-15 15s6.716 15 15 15h60c8.284 0 15-6.716 15-15z"/>
        <path d="M281.673 55.827c-5.857-5.858-15.355-5.858-21.213 0l-42.427 42.427c-5.858 5.858-5.858 15.355 0 21.213 2.929 2.929 6.768 4.394 10.606 4.394 3.838 0 7.678-1.465 10.606-4.394l42.427-42.427c5.858-5.858 5.858-15.355 0-21.213zM140.327 197.173l42.427-42.427c5.858-5.858 5.858-15.355 0-21.213-5.858-5.858-15.355-5.858-21.213 0l-42.427 42.427c-5.858 5.858-5.858 15.355 0 21.213 2.929 2.929 6.768 4.394 10.606 4.394s7.678-1.465 10.606-4.394zM256.327 32.173c-5.858-5.858-15.355-5.858-21.213 0l-60 60c-5.858 5.858-5.858 15.355 0 21.213 5.858 5.858 15.355 5.858 21.213 0l60-60c5.858-5.858 5.858-15.355 0-21.213zM87.327 201.173c-5.858-5.858-15.355-5.858-21.213 0l-60 60c-5.858 5.858-5.858 15.355 0 21.213 5.858 5.858 15.355 5.858 21.213 0l60-60c5.857-5.857 5.857-15.355-0.001-21.213z"/>
      </svg>
    </span>
  `;
  image.style.top = `${y - imageTop}px`;
  image.style.left = `${x - imageLeft}px`;

  list.append(image);

  setTimeout(() => {
    itemImage.remove();
    image.classList.add("image");
    image.style.top = "50%";
    image.style.left = "50%";
    image.style.transform = "translate(-50%, -50%) scale(1)";
  }, 100);
};

const deleteItem = e => {
  const item = e.target.closest(".item");
  const id = item.getAttribute("id");
  const loadedImage = document.querySelector(`.loaded-image:nth-child(${itemIndex(id)})`);

  item.remove();
  loadedImage.remove();
};

const itemIndex = id => {
  const items = document.querySelectorAll(".item");
  let index = 0;
  items.forEach((item, i) => {
    if (item.getAttribute("id") === id) {
      index = i + 1;
    }
  });
  return index;
};


$(document).ready(function() {
  $(".droppable").click(function() {
    $("#fileInput").click();
  });

  $("#fileInput").change(function(event) {
    const fileList = event.target.files;
    // Send file to Flask backend via AJAX
    const formData = new FormData();
    formData.append('file', fileList[0]);
  });
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    $('div.list').append('<h4 class="Statusmsg">'+ data +'</h4>');
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });
  droppable.classList.remove("is-over");
});

