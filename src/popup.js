import './popup.css';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

const table = document.getElementById('specs-table');
const tbody = table.querySelector('tbody');
let data;

// support functions
const getRows = () => {
  return table.querySelectorAll('tbody tr');
};

const getTargetRow = (target) => {
  let elemName = target.tagName.toLowerCase();

  if (elemName == 'tr') return target;
  else return target.closest('tr');
};

const getData = () => {
  // function to get all the data about product and specification table
  let specifications = [];
  let rows = getRows();

  for (let i = 0; i < rows.length; i++) {
    specifications.push({
      name: rows[i].children[1].innerHTML,
      description: rows[i].children[2].innerHTML,
    });
  }

  data.specifications = specifications;

  return data;
};

const addTableRow = (specifications, connection) => {
  // function to create table with Data we get from contentScript
  // insert row in table and adding cells (edit icon, category name, category description, delete icon/button)
  let tr = tbody.insertRow(),
    cells = [
      tr.insertCell(),
      tr.insertCell(),
      tr.insertCell(),
      tr.insertCell(),
    ],
    svgEdit = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
    svgDelete = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  // adding classes to row and cells, mostly for styling, adding ID for interacting with Delete button
  tr.id = specifications.id;
  tr.classList.add('specs-row');
  cells[0].classList.add('specs-table-icon', 'edit-icon');
  cells[1].classList.add('specs-category');
  cells[2].classList.add('specs-data');
  cells[3].classList.add('specs-table-icon', 'delete-icon');

  // adding svg icon for first cell (Check)
  svgEdit.setAttribute('viewBox', '0 0 512 512');
  let svgEditIcon = document.createElementNS(svgEdit.namespaceURI, 'path');
  svgEditIcon.setAttribute(
    'd',
    'M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z'
  );
  svgEditIcon.setAttribute('fill', '#00bf00');
  svgEditIcon.setAttribute('title', 'Изменить строку');
  svgEdit.appendChild(svgEditIcon);

  // adding svg icon for last cell (delete)
  svgDelete.setAttribute('viewBox', '0 0 512 512');
  let svgDeleteIcon = document.createElementNS(svgDelete.namespaceURI, 'path');
  svgDeleteIcon.setAttribute(
    'd',
    'M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z'
  );
  svgDeleteIcon.setAttribute('fill', '#e45757');
  svgDeleteIcon.setAttribute('title', 'Удалить строку');
  svgDelete.appendChild(svgDeleteIcon);

  // add function to redact this row
  svgEdit.addEventListener('click', showEditForm);
  // add function to delete this row
  svgDelete.addEventListener('click', (event) => {
    let row = getTargetRow(event.target);

    if (connection) {
      connection.postMessage({
        from: 'popup',
        subject: 'deleteData',
        id: row.id,
      });
    }
    row.parentElement.removeChild(row);
  });

  // add dragging function
  cells[1].addEventListener('mousedown', mouseDownHandler);
  cells[2].addEventListener('mousedown', mouseDownHandler);

  // appending all the cells into the table row
  cells[0].appendChild(svgEdit);
  cells[1].appendChild(document.createTextNode(specifications.name));
  cells[2].appendChild(document.createTextNode(specifications.description));
  cells[3].appendChild(svgDelete);
};

const getSlideShowHTML = (productData) => {
  let specifications = '';
  let rating = '';
  let typeCollor = 'black';

  if (productData.type == 'gaming' || productData.type == 'multimedia') {
    typeCollor = 'white';
  }

  for (let i = 0; i < productData.specifications.length; i++) {
    let row = productData.specifications[i];
    specifications += `<tr>
      <td>${row.name}</td>
      <td>${row.description}</td>
    </tr>
    `;
  }

  if (productData.rating != 0) {
    rating = `<table>
            <tbody>
              <tr>
                <td>Производительность</td>
                <td>
                  <svg class="star ${
                    productData.rating.proc >= 1 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.proc >= 2 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.proc >= 3 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.proc >= 4 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.proc >= 5 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                </td>
              </tr>
              <tr>
                <td>Мобильность</td>
                <td><svg class="star ${
                  productData.rating.mobil >= 1 ? 'checked' : ''
                }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.mobil >= 2 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.mobil >= 3 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.mobil >= 4 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.mobil >= 5 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                </td>
              </tr>
              <tr>
                <td>Графика</td>
                <td><svg class="star ${
                  productData.rating.graph >= 1 ? 'checked' : ''
                }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.graph >= 2 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.graph >= 3 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.graph >= 4 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                  <svg class="star ${
                    productData.rating.graph >= 5 ? 'checked' : ''
                  }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                      d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
`;
  }

  const html = `<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productData.name}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: "Arial";
    }

    .textframe {
      background-image: url("./${productData.type}.png");
      color: ${typeCollor};
    }

    .slider {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }

    .slides {
      width: 200%;
      height: 1080px;
      display: flex;
      flex-direction: row;
    }

    .slide {
      position: relative;
      width: 50%;
      transition: 1s;
    }

    .first {
      margin: 0;
    }

    #slideCheck:checked~.first {
      margin-left: -50%;
    }

    input {
      display: none;
    }

    #title {
      position: absolute;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      width: 1000px;
      left: 1380px;
      top: 210px;
      font-size: 30px;
      font-family: "Arial Black";
      font-weight: bold;
      transform: translate(-50%, 0);
    }

    #specifications {
      width: 1000px;
      height: 640px;
      overflow-x: hidden;
      overflow-y: auto;
      position: absolute;
      left: 1380px;
      top: 284px;
      font-size: 24px;
      transform: translate(-50%, 0);
    }

    #specs-table {
      table-layout: fixed;
      width: 100%;
    }

    #specs-table tbody>tr> :nth-child(1) {
      text-align: right;
      font-weight: bold;
      padding-right: 8px;
    }

    #specs-table tbody>tr> :nth-child(1) {
      padding-left: 8px;
    }

    #price {
      position: absolute;
      width: 416px;
      left: 1850px;
      top: 964px;
      text-align: right;
      font-size: 56px;
      color: rgb(193, 0, 0);
      font-weight: bold;
      transform: translate(-100%, 0);
    }

    #rating {
      position: absolute;
      left: 1100px;
      top: 964px;
      font-size: 14px;
      transform: translate(-50%, 0);
      /* background-color: aliceblue; */
    }

    #rating table {
      width: 100%;
      table-layout: auto;
      white-space: nowrap;
    }

    #rating table tbody>tr> :nth-child(1) {
      text-align: right;
      padding-right: 8px;
    }

    #rating table tbody>tr> :nth-child(1) {
      vertical-align: text-top;
    }

    .star {
      width: 16px;
      height: 16px;
    }

    .checked {
      fill: orange;
    }
  </style>
</head>

<body>
  <div class="slider">
    <div class="slides">
      <!-- radio button start -->
      <input type="checkbox" name="slideCheck" id="slideCheck">
      <!-- radio button end -->
      <!-- slide images start -->
      <div class="slide textframe first">
        <h1 id="title">Ноутбук ASUS VivoBook Pro 16X M7600QC, OLED (90NB0V81-M01630)</h1>
        <div id="specifications">
          <table id="specs-table">
            <tbody>
            ${specifications}
            <tr>
              <td>Код товара</td>
              <td>${productData.id}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div id="price">${productData.price}</div>
        <div id="rating">
        ${rating}
        </div>
      </div>
      <div class="slide">
        <img src="./amulet.png" alt="" />
      </div>
      <!-- slide images end -->
    </div>
  </div>

  <script>
    let body = document.getElementsByClassName("slider")[0];
    body.addEventListener("click", function () {
      let el = document.documentElement,
        rfs =
          el.requestFullScreen ||
          el.webkitRequestFullScreen ||
          el.mozRequestFullScreen;
      rfs.call(el);
    });

    let counter = 0;
    setInterval(function () {
      counter += 1;
      if (counter === 10) {
        document.getElementById("slideCheck").checked = true;
      }
      if (counter === 15) {
        document.getElementById("slideCheck").checked = false;
        counter = 0;
      }
    }, 1000)

  </script>
</body>

</html>`;

  return html;
};

// image to base64 functions
const getBase64img = async (image) => {
  let background = await loadImage(`./img/${image}.jpg`);

  const canvas = document.createElement('canvas');

  // We use naturalWidth and naturalHeight to get the real image size vs the size at which the image is shown on the page
  canvas.width = background.naturalWidth;
  canvas.height = background.naturalHeight;

  // We get the 2d drawing context and draw the image in the top left
  canvas.getContext('2d').drawImage(background, 0, 0);

  // Convert canvas to DataURL and log to console
  const dataURL = canvas.toDataURL();

  // Convert to Base64 string
  const base64 = getBase64StringFromDataURL(dataURL);

  return base64;
};

const getBase64StringFromDataURL = (dataURL) => {
  return dataURL.replace('data:', '').replace(/^.+,/, '');
};

const loadImage = (path) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // to avoid CORS if used with Canvas
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
  });
};

// table drag & drop functions
const mouseDownHandler = (event) => {
  // declare temp variables
  document.tempVariables = {
    currRow: null,
    dragElem: null,
    mouseDownX: 0,
    mouseDownY: 0,
    mouseX: 0,
    mouseY: 0,
    mouseDrag: false,
  };

  if (event.button != 0) return true;

  let target = getTargetRow(event.target);
  if (target) {
    document.tempVariables.currRow = target;
    addDraggableRow(target);
    document.tempVariables.currRow.classList.add('is-dragging');

    let coords = getMouseCoords(event);
    document.tempVariables.mouseDownX = coords.x;
    document.tempVariables.mouseDownY = coords.y;

    document.tempVariables.mouseDrag = true;
  }

  // Attach the listeners to `document`
  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
};

const mouseMoveHandler = (event) => {
  if (!document.tempVariables.mouseDrag) return;

  let coords = getMouseCoords(event);
  document.tempVariables.mouseX = coords.x - document.tempVariables.mouseDownX;
  document.tempVariables.mouseY = coords.y - document.tempVariables.mouseDownY;

  moveRow(document.tempVariables.mouseX, document.tempVariables.mouseY);
};

const mouseUpHandler = (event) => {
  if (!document.tempVariables.mouseDrag) return;

  // remove "is-dragging" tag from dragging row, remove placeholder row
  document.tempVariables.currRow.classList.remove('is-dragging');
  table.removeChild(document.tempVariables.dragElem);

  // remove temp variables
  delete document.tempVariables;
  // Remove the handlers of `mousemove` and `mouseup`
  document.removeEventListener('mousemove', mouseMoveHandler);
  document.removeEventListener('mouseup', mouseUpHandler);
};

const addDraggableRow = (target) => {
  document.tempVariables.dragElem = target.cloneNode(true);
  document.tempVariables.dragElem.classList.add('draggable-table__drag');
  document.tempVariables.dragElem.style.height = getStyle(target, 'height');
  document.tempVariables.dragElem.style.background = getStyle(
    target,
    'backgroundColor'
  );
  for (let i = 0; i < target.children.length; i++) {
    let oldTD = target.children[i],
      newTD = document.tempVariables.dragElem.children[i];
    newTD.style.width = getStyle(oldTD, 'width');
    newTD.style.height = getStyle(oldTD, 'height');
    newTD.style.padding = getStyle(oldTD, 'padding');
    newTD.style.margin = getStyle(oldTD, 'margin');
  }

  table.appendChild(document.tempVariables.dragElem);

  let tPos = target.getBoundingClientRect(),
    dPos = document.tempVariables.dragElem.getBoundingClientRect();
  document.tempVariables.dragElem.style.bottom = `${
    dPos.y - tPos.y - tPos.height
  }px`;
  document.tempVariables.dragElem.style.left = '-1px';

  document.dispatchEvent(
    new MouseEvent('mousemove', {
      view: window,
      cancelable: true,
      bubbles: true,
    })
  );
};

const swapRow = (row, index) => {
  let currIndex = Array.from(tbody.children).indexOf(
      document.tempVariables.currRow
    ),
    row1 = currIndex > index ? document.tempVariables.currRow : row,
    row2 = currIndex > index ? row : document.tempVariables.currRow;

  tbody.insertBefore(row1, row2);
};

const moveRow = (x, y) => {
  document.tempVariables.dragElem.style.transform =
    'translate3d(' + x + 'px, ' + y + 'px, 0)';

  let dPos = document.tempVariables.dragElem.getBoundingClientRect(),
    currStartY = dPos.y,
    currEndY = currStartY + dPos.height,
    rows = getRows();

  for (let i = 0; i < rows.length; i++) {
    let rowElem = rows[i],
      rowSize = rowElem.getBoundingClientRect(),
      rowStartY = rowSize.y,
      rowEndY = rowStartY + rowSize.height;

    if (
      document.tempVariables.currRow !== rowElem &&
      isIntersecting(currStartY, currEndY, rowStartY, rowEndY)
    ) {
      if (Math.abs(currStartY - rowStartY) < rowSize.height / 2)
        swapRow(rowElem, i);
    }
  }
};

const getMouseCoords = (event) => {
  return {
    x: event.clientX,
    y: event.clientY,
  };
};

const getStyle = (target, styleName) => {
  let compStyle = getComputedStyle(target),
    style = compStyle[styleName];

  return style ? style : null;
};

const isIntersecting = (min0, max0, min1, max1) => {
  return (
    Math.max(min0, max0) >= Math.min(min1, max1) &&
    Math.min(min0, max0) <= Math.max(min1, max1)
  );
};

// data edit & add form fucntions
const showEditForm = (event) => {
  // get form elements
  let background = document.getElementById('popupBackground');
  let formContainer = document.getElementById('popup');
  let form = formContainer.getElementsByTagName('form')[0];
  let formNameField = document.getElementById('formName');
  let formDescriptionField = document.getElementById('formDescription');
  let row = getTargetRow(event.target);
  let hideButton = document.getElementById('hide-btn');

  // get target row name and description elements
  let name = row.children[1],
    description = row.children[2];

  // set input text values to target row name and description
  formNameField.value = name.innerHTML;
  formDescriptionField.value = description.innerHTML;

  // show form container
  background.style.display = 'flex';
  formContainer.style.display = 'flex';

  // functions for submit and close buttons
  const onSubmit = (e) => {
    // prevent default behavior (i.e. opening emty url)
    e.preventDefault();

    // change row name and description
    name.innerHTML = formNameField.value;
    description.innerHTML = formDescriptionField.value;

    // hide form container
    hideForm();
  };

  const hideForm = (e) => {
    // hide container
    background.style.display = 'none';
    formContainer.style.display = 'none';

    // remove event listeners
    form.removeEventListener('submit', onSubmit);
    hideButton.removeEventListener('click', hideForm);
  };

  // add event listeners to the form
  form.addEventListener('submit', onSubmit, { once: true });
  hideButton.addEventListener('click', hideForm);

  // show form container
  background.style.display = 'flex';
  formContainer.style.display = 'flex';
};

const showAddForm = (event) => {
  // get form elements
  let background = document.getElementById('popupBackground');
  let formContainer = document.getElementById('popup');
  let form = formContainer.getElementsByTagName('form')[0];
  let formNameField = document.getElementById('formName');
  let formDescriptionField = document.getElementById('formDescription');
  let hideButton = document.getElementById('hide-btn');

  // set input text values
  formNameField.value = '';
  formDescriptionField.value = '';

  // functions for submit and close buttons
  const onSubmit = (e) => {
    // prevent default behavior (i.e. opening emty url)
    e.preventDefault();
    // create new row with data from input fields
    addTableRow(
      { name: formNameField.value, description: formDescriptionField.value },
      tbody
    );

    // hide form container
    hideForm();
  };

  const hideForm = (e) => {
    // hide container
    background.style.display = 'none';
    formContainer.style.display = 'none';

    // remove event listeners
    form.removeEventListener('submit', onSubmit);
    hideButton.removeEventListener('click', hideForm);
  };

  // add event listeners to the form
  form.addEventListener('submit', onSubmit, { once: true });
  hideButton.addEventListener('click', hideForm);

  // show form container
  background.style.display = 'flex';
  formContainer.style.display = 'flex';
};

// download functions
const downloadHTML = async (event) => {
  let productData = getData();
  let zip = new JSZip();

  zip.file(`${productData.name}.html`, getSlideShowHTML(productData));
  zip.file(`${productData.type}.png`, await getBase64img(productData.type), {
    base64: true,
  });
  zip.file('amulet.png', await getBase64img('amulet'), { base64: true });
  zip.generateAsync({ type: 'blob' }).then(function (blob) {
    saveAs(blob, `${productData.id}.zip`);
  });
};

// function to convert images to Base64 format
const addDefaultListeners = () => {
  const addButton = document.getElementById('add-btn');
  const downloadHTMLButton = document.getElementById('download-btn');
  const selectType = document.getElementById('select-type');

  addButton.addEventListener('click', showAddForm);
  downloadHTMLButton.addEventListener('click', downloadHTML);
  selectType.addEventListener('change', (event) => {
    let image = document.getElementById('previewImage');
    image.src = `./img/${event.target.value}.jpg`;
    data.type = event.target.value;
  });
};

// establish connection with content script
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const port = chrome.tabs.connect(tabs[0].id, { name: 'productDataExchange' });
  // bind default eventListeners
  addDefaultListeners();

  // request initial data
  port.postMessage({ from: 'popup', subject: 'getData' });

  // messege handler(s)
  port.onMessage.addListener(function (msg) {
    if (msg.from === 'content' && msg.subject === 'updateData') {
      const selectType = document.getElementById('select-type');
      let image = document.getElementById('previewImage');

      // write initial data about product from content scrypt to a variable
      data = msg.data;

      selectType.value = data.type;
      image.src = `./img/${selectType.value}.jpg`;

      // selectType.value = data.tyoe;
      // add rows to the tech specifications table, using data from content scrypt
      for (let i = 0; i < msg.data.specifications.length; i++) {
        addTableRow(msg.data.specifications[i], port);
      }
    }
  });
});
