(() => {
  const getData = () => {
    // function to get data from all checked specification rows, plus product ID, price and name
    let checkboxes = document.getElementsByClassName('ext_target_specs');
    let productType = getType();
    let productName = document.getElementById('pagetitle').innerHTML;
    let productPrice = document
      .getElementsByClassName('bx-more-price-text')[0]
      .innerHTML.replace('₸', '')
      .trim();
    let productSpecifications = [];
    let productID = document
      .getElementsByClassName('bx-card-mark')[0]
      .children[0].innerHTML.split(' ')[1];

    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        productSpecifications.push({
          id: checkboxes[i].id,
          name: checkboxes[i].parentElement.children[1].children[0].innerHTML,
          description: checkboxes[i].parentElement.children[2].innerHTML,
        });
      }
    }

    let productData = {
      type: productType,
      name: productName,
      price: productPrice,
      specifications: productSpecifications,
      id: productID,
      rating: getRating(),
    };

    return productData;
  };

  const getType = () => {
    try {
      const typeElement = document.getElementsByClassName('segment')[0];
      let type;
      if (typeElement.classList[1] == 'S1') type = 'multimedia';
      else if (typeElement.classList[1] == 'S3') type = 'business';
      else if (typeElement.classList[1] == 'S4') type = 'gaming';
      else type = 'home';

      return type;
    } catch (error) {
      return 'home';
    }
  };

  const getRating = () => {
    try {
      const ratingProcElement = document.getElementsByClassName('proc')[0];
      const ratingGraphElement = document.getElementsByClassName('graph')[0];
      const ratingMobilElement = document.getElementsByClassName('mobil')[0];

      let ratingProc = parseInt(ratingProcElement.classList[1].slice(-1)),
        ratingGraph = parseInt(ratingGraphElement.classList[1].slice(-1)),
        ratingMobil = parseInt(ratingMobilElement.classList[1].slice(-1));

      return {
        proc: ratingProc,
        graph: ratingGraph,
        mobil: ratingMobil,
      };
    } catch (error) {
      return 0;
    }
  };

  const addCheckboxes = () => {
    // function to add checkboxes before each product specification
    let specsList = document.getElementsByClassName('bx_detail_chars_i');

    for (var i = 0; i < specsList.length; i++) {
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'ext_target_specs';
      checkbox.name = 'specs';
      checkbox.id = `ext_checkbox_${i}`;

      specsList[i].insertBefore(checkbox, specsList[i].firstChild);
    }
  };

  const checkDefaultSpecs = () => {
    // function to get all the default product data and set corresponding checkboxes to "true"
    let ShortDescription = document
      .getElementsByClassName('bx-short-desc')[0]
      .getElementsByTagName('li');
    let checkboxes = document.getElementsByClassName('ext_target_specs');
    let defaultSpecs = [
      'UID товара',
      'Операционная система',
      'Вес, кг',
      'Срок гарантии (мес.)',
      'Вес изделия',
    ];

    // get category name for default specs
    for (let i = 0; i < ShortDescription.length; i++) {
      defaultSpecs.push(ShortDescription[i].innerHTML.split(':')[0]);
    }

    // set checkboxes for default specs to true
    for (let i = 0; i < checkboxes.length; i++) {
      if (
        defaultSpecs.includes(
          checkboxes[i].parentElement.children[1].children[0].innerHTML
        )
      ) {
        checkboxes[i].checked = true;
      }
    }
  };

  //main
  addCheckboxes();
  checkDefaultSpecs();
  getType();

  chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name === 'productDataExchange');
    port.onMessage.addListener(function (msg) {
      if (msg.from === 'popup' && msg.subject === 'getData') {
        port.postMessage({
          from: 'content',
          subject: 'updateData',
          data: getData(),
        });
        console.log('DONE');
      } else if (msg.from === 'popup' && msg.subject === 'deleteData') {
        var checkbox = document.getElementById(msg.id);
        checkbox.checked = false;
      }
    });
  });
})();
