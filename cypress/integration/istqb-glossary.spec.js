/// <reference types="cypress" />

const istqbSyllabus = 'Foundation v3.1'; // type of syllabus
const langTranslate = 'Russian'; // translation language
const jsonFile = `./cypress/fixtures/ISTQB ${istqbSyllabus}.json`;

describe('Create ISQTB glossary course in SuperMemo', () => {
  const selectOptions = () => {
    cy.contains('Advanced Options').click();
    cy.get('.syllabi').contains('Uncheck All').click();
    cy.contains(istqbSyllabus).click();
    cy.get('.methods').contains('Uncheck All').click();
    cy.get('input[value="terms"]').check();
    cy.get('input[name="multi-language"]').click();
    cy.get('select[name="language-selector[]"]').eq(0).select(langTranslate);
    cy.contains('Advanced Search').click();
    cy.wait('@search');
  };

  const countPages = () => {
    cy.contains('Last').click();
    cy.wait('@search');
    cy.get('li').last().then(($pages) => {
      const pages = $pages.text();
      cy.wrap(pages).as('pages');
    });
    cy.contains('First').click();
    cy.wait('@search');
  };

  const countTerms = () => {
    cy.get('div[class="term-row"]').parent().its('length')
      .then((terms) => {
        cy.wrap(terms).as('terms');
      });
  };

  const checkTranslate = (index) => {
    cy.get('div[class="term-row"]').parent().eq(index).find('.term-heading')
      .its('length')
      .then((translate) => {
        cy.wrap(translate).as('translate');
      });
  };

  const expandJson = () => {
    cy.readFile(jsonFile).then((data) => {
      data.push({});
      cy.writeFile(jsonFile, data);
    });
  };

  const writeToJson = (counter, type) => {
    cy.get('@text').then((text) => {
      cy.readFile(jsonFile).then((data) => {
        if (type === 'termEn') {
          data[counter].termEn = text.trim();
        }
        if (type === 'definitionEn') {
          data[counter].definitionEn = text.trim();
        }
        if (type === 'termRu') {
          data[counter].termRu = text.trim();
        }
        if (type === 'definitionRu') {
          data[counter].definitionRu = text.trim();
        }
        cy.writeFile(jsonFile, data);
      });
    });
  };

  const saveText = (counter, index, number, selector, type) => {
    cy.get('div[class="term-row"]').parent().eq(index).find(selector)
      .eq(number)
      .then(($text) => {
        const text = $text.text();
        cy.wrap(text).as('text');
        writeToJson(counter, type);
      });
  };

  it('Parse data from ISTQB and save in JSON', () => {
    let counter = 0;

    cy.writeFile(jsonFile, []);
    cy.intercept('POST', '/api/v2/search').as('search');
    cy.visit('https://glossary.istqb.org/en/search/');
    cy.wait('@search');
    cy.wait('@search');
    selectOptions();
    countPages();
    cy.get('@pages').then((pages) => {
      for (let k = 2; k <= pages + 1; k += 1) {
        countTerms();
        cy.get('@terms').then((terms) => {
          for (let i = 0; i < terms; i += 1) {
            checkTranslate(i);
            cy.get('@translate').then((translate) => {
              expandJson();
              saveText(counter, i, 0, '.term-heading', 'termEn');
              saveText(counter, i, 0, '.term-definition-preview', 'definitionEn');
              if (translate > 1) {
                saveText(counter, i, 1, '.term-heading', 'termRu');
                saveText(counter, i, 1, '.term-definition-preview', 'definitionRu');
              }
              counter += 1;
            });
          }
        });
        if (k === pages + 1) return false;
        cy.get(`span[data-page="${k}"]`).click();
        cy.wait('@search');
      }
      return false;
    });
  });

  it('Create SuperMemo course', () => {
    cy.intercept('GET', '/api/users/**/courses/**/pages?**').as('pages');
    cy.visit('https://app.supermemo.com');
    cy.get('input[type="email"]').type(Cypress.env('emailSuperMemo'));
    cy.get('input[type="password"]').type(Cypress.env('passwordSuperMemo'));
    cy.contains('Log in').click();
    cy.get('button[ng-show="isDropMenuVisible()"]').click();
    cy.contains('COURSE EDITOR').click();
    cy.get('button[ng-show="selectedCourse"]').click();
    cy.wait('@pages');
    cy.readFile(jsonFile).then((data) => {
      cy.get('input[placeholder="New course title"]').type(`ISTQB ${istqbSyllabus}{enter}`);
      cy.wait('@pages');
      cy.wait('@pages');
      for (let i = 0; i < data.length; i += 1) {
        const item = i - (Math.floor(i / 25)) * 25;
        cy.get('.add-item').click();
        cy.wait('@pages');
        cy.wait(1000);
        cy.get('[placeholder="Type in the question"]').eq(item).type(`${data[i].termEn}{enter}{enter}${data[i].termRu}`);
        cy.get('[placeholder="Type in the answer"]').eq(item).type(`${data[i].definitionEn}{enter}{enter}${data[i].definitionRu}`);
      }
    });
  });
});
