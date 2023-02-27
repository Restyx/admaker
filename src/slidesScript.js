import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

(() => {
  // image to base64 functions
  const getBase64img = (image) => {
    let background = image;

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

  const getImages = () => {
    const container = document.getElementsByClassName('bx-content')[0];
    const imagesParagraphs = container.getElementsByTagName('p');
    let images = [];

    for (let i = 0; i < imagesParagraphs.length; i++) {
      images.push(imagesParagraphs[i].children[0]);
    }
    return images;
  };

  const download = async (event) => {
    event.preventDefault();

    let button = event.target;
    let images = getImages();
    let amuletImg = await loadImage(chrome.runtime.getURL('./img/amulet.png'));
    let banksImg = await loadImage(chrome.runtime.getURL('./img/banks.png'));

    let base64Images = [];
    let zip = new JSZip();

    button.innerHTML = 'Обработка: 0%';
    for (let i = 0; i < images.length; i++) {
      base64Images.push(getBase64img(images[i]));
      button.innerHTML = `Обработка: ${(i / images.length) * 100}%`;
    }

    const url = new URL(location.href);
    let articles = url.searchParams.get('SKU').split('\r\n');

    button.innerHTML = 'Упаковка: 0%';
    for (let i = 0; i < articles.length; i++) {
      zip.file(`${articles[i]}/${articles[i]}(RU).png`, base64Images[i * 2], {
        base64: true,
      });
      zip.file(
        `${articles[i]}/${articles[i]}(KZ).png`,
        base64Images[i * 2 + 1],
        {
          base64: true,
        }
      );
      zip.file(`${articles[i]}/amulet.png`, getBase64img(amuletImg), {
        base64: true,
      });
      zip.file(`${articles[i]}/banks.png`, getBase64img(banksImg), {
        base64: true,
      });
      button.innerHTML = `Упаковка: ${(i / articles.length) * 100}%`;
    }
    zip.generateAsync({ type: 'blob' }).then(function (blob) {
      saveAs(blob, `Reklama.zip`);
    });
    button.innerHTML = 'Скачать Слайды';
  };

  const addButton = () => {
    const imagesParagraphs = document
      .getElementsByClassName('bx-content')[0]
      .getElementsByTagName('p');

    if (imagesParagraphs.length > 0) {
      let container = document
        .getElementsByClassName('bx-content')[0]
        .getElementsByTagName('form')[0]
        .getElementsByClassName('form-group')[1];
      let downloadButton = document.createElement('button');

      downloadButton.innerHTML = 'Скачать Слайды';
      downloadButton.addEventListener('click', download);
      container.appendChild(downloadButton);
    }
  };

  addButton();
})();
