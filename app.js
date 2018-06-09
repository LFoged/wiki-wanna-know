'use strict';


/** 
 * TODO:
 * 'Suggested query' button / search if no results. 
 * 'clear search' / 'new search button'
*/


// GLOBAL VARIABLES - include ref. to 'document' to min. lookup
const doc = document;
const searchForm = doc.querySelector('.search-form');
const searchInput = doc.querySelector('.search-input');
const sectionResults = doc.querySelector('.section-results');


// PERIPHERAL FUNCTIONS
// FUNCTION - create element, assign className & other attribute
const newElement = (element, classNm) => {
    const newEl = doc.createElement(element);
    newEl.className = classNm;

    return newEl;
};

// FUNCTION - clear past result from DOM, if present
const clearPastResults = () => {
    while (sectionResults.hasChildNodes()) {
        sectionResults.removeChild(sectionResults.firstChild);
    }
};

// FUNCTION - display error alert messages
const showAlert = (message='Aww shucks! Something went wrong') => {
    const alertDiv = newElement('div', 'alert');
    alertDiv.appendChild(doc.createTextNode(message));
    // attach alert to DOM if none already present
    if (!doc.querySelector('.alert')) searchForm.insertBefore(alertDiv, searchInput);
    // Timeout to remove alert after 2.5 seconds, if present
    setTimeout(() => {
        if (doc.querySelector('.alert')) return doc.querySelector('.alert').remove(); 
    }, 2500);
};


// CORE FUNCTIONS
// FUNCTION - check searchInput isn't empty or just whitespace(s)
const validateQueryText = (queryText) => {
    if (!queryText || (/^\s+$/).test(queryText)) {
        return showAlert('Please enter a search query');
    }

    return queryText;
};

// FUNCTION - GET data from Wikipedia => response to 'checkResponse' func.
const makeRequest = (queryText) => {
    const url = {
        origin: 'https://en.wikipedia.org',
        path: '/w/api.php',
        query: `?action=query&origin=*&list=search&format=json&srsearch=${queryText}`
    };
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${url.origin}${url.path}${url.query}`, true);
    xhr.onload = () => {
        if (xhr.status !== 200) return showAlert();
        const response = JSON.parse(xhr.responseText);
        return prepResponse(response);
    };
    xhr.onerror = error => showAlert();
    
    xhr.send();
};

// FUNCTION - check for empty response => relevant data to 'printResults' func.
const prepResponse = (rawResponse) => {
    const response = rawResponse.query;
    // clear results from past searches if any present
    if (sectionResults.hasChildNodes()) clearPastResults();
    if (response.search.length > 0) {
        const data = {
            query: searchInput.value,
            results: [...response.search],
            hits: response.searchinfo.totalhits
        };

        return printResults(data);
    }
    if (response.searchinfo.suggestion) {
        printSuggestion(response.searchinfo.suggestion);
    }

    return showAlert(`Found no matching results for "${searchInput.value}"`);
};

// FUNCTION - print suggested query if any returned
const printSuggestion = (suggestion) => {
    const suggestDiv = newElement('div', 'suggest-div');
    const suggestQuery = newElement('span', 'suggest-query');

    suggestQuery.textContent = `${suggestion}`;
    suggestDiv.appendChild(doc.createTextNode(`Suggested query: `));
    suggestDiv.appendChild(suggestQuery);
    
    return sectionResults.appendChild(suggestDiv);
};


// FUNCTION - create elements to display data & append these to DOM
const printResults = (data) => {
    const query = data.query;
    const results = data.results;
    const hits = data.hits;
    // use documentFragment to only update DOM once
    const fragment = doc.createDocumentFragment();
    const resultStats = newElement('h4', 'result-stats');
    resultStats.textContent = `Showing ${results.length} results of ${hits} total hits for "${query}"`;
    fragment.appendChild(resultStats);

    results.map(result => {
        const resultDiv = newElement('div', 'result-div');
        const resultLink = newElement('a', 'result-link');      
        const resultBody = newElement('p', 'result-body');
        const resultWordCount = newElement('p', 'result-word-count');           

        resultLink.href = `https://en.wikipedia.org/wiki/${result.title.replace(/\s/, '_')}`;
        resultLink.target = "_blank";
        resultLink.textContent = result.title;
        resultBody.innerHTML = `${result.snippet}...`;
        resultWordCount.innerHTML = `<em>Article Word Count:</em> ${result.wordcount}`; 

        resultDiv.appendChild(resultLink);
        resultDiv.appendChild(resultBody);
        resultDiv.appendChild(resultWordCount);
        // Append resultDiv to documentFragment
        return fragment.appendChild(resultDiv);
    }); 

    return sectionResults.appendChild(fragment);
};


// FUNCTION - initialize program with eventListeners
const init = (() => {
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        // validate searchInput isn't empty. Make request if valid
        const queryText = searchInput.value;
        if (validateQueryText(queryText)) return makeRequest(queryText);
    });

    sectionResults.addEventListener('click', (event) => {
        if (event.target.className.includes('suggest')) {
            const suggestQuery = doc.querySelector('.suggest-query').textContent;
            searchInput.value = suggestQuery;
            
            return makeRequest(suggestQuery);
        }
    });
})();

