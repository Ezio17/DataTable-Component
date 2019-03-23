/* eslint-disable indent */
const url = 'https://mate-academy.github.io/phone-catalogue-static/api/phones.json';

// eslint-disable-next-line no-undef
const { debounce } = _;
const QUERY_CHANGE_DELAY = 300;

class Datatable {
  constructor({ element, items, config }) {
    this._element = element;
    this._items = items;
    this._default = items;
    this._config = config;

    this._search = document.querySelector('.phone-search');

    this._render(this._default);
    this._renderSearch();
    this._setSearch();
    this._phoneSort();
    this._edit();
    this._checkbox();
    this._getSelected();
  }

  async _getData() {
    const data = await this._items;
    // eslint-disable-next-line no-console
    console.log(data);
  }

  async _phoneSort() {
    this._item = await this._items;
    let isBoolean = false;

    this._element.addEventListener('click', (event) => {
      const sortElement = event.target.closest('[data-sort]');
      let sort;

      if (!sortElement) {
        return;
      }
      const getDataName = sortElement.dataset.sort;

      const sortPhones = (sortBy) => {
        if (!isBoolean) {
          isBoolean = true;

          sort = (a, b) => {
            if (typeof a[sortBy] === 'number') {
              return b[sortBy] - a[sortBy];
            }
            if (typeof a[sortBy] === 'string') {
              return a[sortBy].localeCompare(b[sortBy]);
            }

            return a[sortBy] === b[sortBy];
          };
        } else if (isBoolean) {
          isBoolean = false;

          sort = (a, b) => {
            if (typeof a[sortBy] === 'number') {
              return a[sortBy] - b[sortBy];
            }
            if (typeof a[sortBy] === 'string') {
              return b[sortBy].localeCompare(a[sortBy]);
            }

            return a[sortBy] === b[sortBy];
          };
        }
        this._item.sort(sort);
      };
      sortPhones(getDataName);
      this._render(this._item);
      this._checkbox();
    });
  }

  async _setSearch() {
    this._default = await this._default;

    const inputSearch = document.querySelector('#search');
    let searchElement = document.querySelector('[data-search]');
    searchElement = searchElement.dataset.search;

    inputSearch.addEventListener('input', debounce(() => {
      this._items = [];
      const inputSearchValue = inputSearch.value.toLowerCase();

      // eslint-disable-next-line no-restricted-syntax
      for (const item of this._default) {
        if (item[searchElement].toLowerCase().includes(inputSearchValue)) {
          this._items.push(item);
        }
      }
      this._render(this._items);
      this._checkbox();
    }, QUERY_CHANGE_DELAY));
  }

  async _edit() {
    this._item = await this._items;

    this._element.addEventListener('dblclick', (event) => {
      const td = event.target.closest('td');
      const checkbox = event.target.closest('[data-checkbox="boxItem"]');

      if (!td || checkbox) {
        return;
      }

      const defaultContent = td.textContent;

      const promise = new Promise((resolve) => {
        td.innerHTML = `<input class="edit" value="${td.textContent}">
                        <button class="edit-cancel">Cancel</button>
                       `;
        resolve();
      });
      const input = document.querySelector('.edit');
      input.focus();

      // eslint-disable-next-line no-shadow
      input.addEventListener('dblclick', (event) => {
        event.stopPropagation();
      });

      promise
        .then(
          () => {
            // eslint-disable-next-line no-shadow
            td.addEventListener('keypress', (event) => {
              if (event.keyCode === 13) {
                td.innerHTML = `<td>${input.value}</td>`;
              } else if (event.keyCode === 27) {
                input.value = defaultContent;
                td.innerHTML = `<td>${defaultContent}</td>`;
              }
            });
          },
        ).then(
          () => {
            // eslint-disable-next-line no-shadow
            document.addEventListener('click', (event) => {
              if (event.target.closest('.edit')) {
                return;
              }
              if (event.target.closest('.edit-cancel')) {
                input.value = defaultContent;
                td.innerHTML = `<td>${defaultContent}</td>`;
              }

              td.innerHTML = `<td>${input.value}</td>`;
            });
          },
          // eslint-disable-next-line no-console
        ).catch(error => console.warn(error));
    });
  }

  async _checkbox() {
    this._item = await this._items;
    const mainCheckbox = document.querySelector('[data-checkbox="main"]');
    const [...itemCheckbox] = document.querySelectorAll('[data-checkbox="item"]');
    let itemCountTrue = 0;

    this._element.addEventListener('change', (event) => {
      if (!event.target.closest('[data-checkbox="main"]')) {
        return;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const item of itemCheckbox) {
        if (mainCheckbox.checked === true) {
          itemCountTrue++;
          item.checked = true;
        } else if (mainCheckbox.checked === false) {
          itemCountTrue--;
          item.checked = false;
        }
      }
    });

    this._element.addEventListener('change', (event) => {
      const checkbox = event.target.closest('[data-checkbox="item"]');

      if (!checkbox) {
        return;
      }

      if (checkbox.checked === true) {
        itemCountTrue++;
      } else {
        mainCheckbox.checked = false;
        itemCountTrue--;
      }

      if (itemCountTrue === itemCheckbox.length) {
        mainCheckbox.checked = true;
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  _getSelected() {
    const [...itemCheckbox] = document.querySelectorAll('[data-checkbox="item"]');
    const checkedItems = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const item of itemCheckbox) {
      if (item.checked === true) {
        const items = {
          age: item.dataset.checkboxAge,
          name: item.dataset.checkboxName,
        };
        checkedItems.push(items);
      }
    }

    return checkedItems;
  }

  _renderTitle() {
    return `
    ${Object.entries(this._config).map(([keys, value]) => `
           <th 
           ${value.sortElementable ? `data-sort="${keys}" class="active"` : ''}
           ${value.isSearchable ? `data-search="${keys}"` : ''} 
           >${value.title}</th>
    `).join('')
      }
    `;
  }

  _renderItems(item) {
    return `
    <tr>
    <td data-checkbox='boxItem'>
     <input type='checkbox' data-checkbox-age='${item.age}' data-checkbox-name='${item.name}' data-checkbox='item'>
    </td>
   ${Object.keys(this._config).map(key => `
       <td>${item[key]}</td>
     `).join('')}    
    </tr> 
    `;
  }

  _renderSearch() {
    this._search.innerHTML = `
    <label for="search" class='active'>Найти:</label>
    <input type="text" id="search" placeholder="Поиск">
    `;
  }

  async _render(items) {
    this._item = await items;
    this._element.innerHTML = `
      <tr> 
        <th>
          <input type='checkbox' data-checkbox="main">
        </th>
       ${ this._renderTitle()}
      </tr>   
        ${
      this._item.map(item => this._renderItems(item)).join('')
      } 
        `;
  }
}

// eslint-disable-next-line arrow-body-style
const getPhoneFromServer = (phoneUrl) => {
  return fetch(phoneUrl).then(
    response => response.json(),

    // eslint-disable-next-line no-console
  ).catch(error => console.log(error));
};

// eslint-disable-next-line no-unused-vars
const table = new Datatable({
  element: document.querySelector('.table'),
  items: getPhoneFromServer(url),

  config: {

    age: {
      title: 'Возраст',
      sortElementable: true,
    },
    name: {
      title: 'Название',
      sortElementable: true,
      isSearchable: true,
    },
    snippet: {
      title: 'Описание',
    },
  },
});
