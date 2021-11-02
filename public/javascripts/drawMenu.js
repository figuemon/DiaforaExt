const loadingUrl = host;
var cacheSearch = '';
var currentSelectedItem = undefined;
var lastSearchIndex = 0;
//this variables are accesed all over the code to enable or disable features
var interface_variables = {
    lines: true,
    squares: false,
    removed: false,
    added: false,
    bars: false,
    congruence: false,
    merge: false,
    split: false,
    rename: false,
    move: false,
    authorChanged: false,
    bundling: 0.5,
    changedLines: false,
    secondaryFilter: false,
    showDetails: true
};

//Used when the buttton exit is cliked
function onExit() {
    let nextURLArr = window.location.href.split('?');
    let nextURL = '/';
    if (nextURLArr.length == 2) {
        nextURL += `?${nextURLArr[1]}`;
    }
    window.location.replace(nextURL);
}

//writes to info square
//used in other modules
function showInfo(title, body) {
    if (title) {
        $('.infoTitle').html(title);
    }

    if (body) {
        $('.infoBody').html(body);
    }
}

//enable and disable the direrent interface variables

function onLineChange() {
    interface_variables.lines = !interface_variables.lines;
}

function onBoxChange() {
    interface_variables.squares = !interface_variables.squares;
}

function onRemovedChange() {
    interface_variables.removed = !interface_variables.removed;
    optionMenuChange();
}

function onBarsChange() {
    interface_variables.bars = !interface_variables.bars;
}

function onAddedChange() {
    interface_variables.added = !interface_variables.added;
    optionMenuChange();
}

function onAuthorChange() {
    interface_variables.authorChanged = !interface_variables.authorChanged;
    optionMenuChange();
}


function onSearch(searchText) {
    searchText = searchText ? searchText : document.getElementById('tags').value;
    if (currentSelectedItem) {
        $(currentSelectedItem).attr('fill', 'black');
    }
    if (cacheSearch != searchText) {
        cacheSearch = searchText;
        lastSearchIndex = 0;
    }
    if (protoType == 1 && sunburstChart) { // Circular visualization
        let currentFilters = filterCombination();
        const dataStructure = filteredTrees[currentFilters];
        const node = searchTree(dataStructure, searchText);
        sunburstChart.focusOnNode(node);
        return true;
    } else {
        const currentElement = $("text:contains('" + searchText + "')");
        if (currentElement.length > 0) {
            lastSearchIndex = lastSearchIndex < currentElement.length ? lastSearchIndex : 0;
            currentElement[lastSearchIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
            $(currentElement[lastSearchIndex]).attr('fill', 'blue');
            currentSelectedItem = currentElement[lastSearchIndex];
            lastSearchIndex++;
            return true;
        }
    }
    return false;
}

function searchTree(element, matchingTitle) {
    if (element.name == matchingTitle) {
        return element;
    } else if (element.c != null) {
        var i;
        var result = null;
        for (i = 0; result == null && i < element.c.length; i++) {
            result = searchTree(element.c[i], matchingTitle);
        }
        return result;
    }
    return null;
}

function optionMenuChange() {
    document.getElementById('busyLoader').style.display = 'block';
    setTimeout(() => {
        interface_variables.secondaryFilter = true;
        LoadPrototypes().then(e => {
            hideLoader();
        });
    }, 10);
}

//task activating functionss
function onCongruenceChange() {
    interface_variables.congruence = !interface_variables.congruence;
    interface_variables.changedLines = true;
}

function onMergeChange() {
    interface_variables.merge = !interface_variables.merge;
    interface_variables.changedLines = true;
    optionMenuChange();
}

function onSplitChange() {
    interface_variables.split = !interface_variables.split;
    interface_variables.changedLines = true;
    optionMenuChange();
}

function onRenameChange() {
    interface_variables.rename = !interface_variables.rename;
    interface_variables.changedLines = true;
    optionMenuChange();
}

function onMoveChange() {
    interface_variables.move = !interface_variables.move;
    interface_variables.changedLines = true;
    optionMenuChange();
}

function onSliderChange(value) {
    interface_variables.bundling = value / 100;
}

function onMatrixClicked(value) {
    //
}

function onExpand() {
    expandAllLevels();
}

/**
 *  When the statistics panel is hidden the 
 *  graph area shoul be maximized
 */
function toggleGraphSize() {
    const sketchHolder = $('#sketch-holder');
    if (sketchHolder.hasClass('right')) {
        $('#statistics').collapse('hide');
        sketchHolder.removeClass('right');
        sketchHolder.addClass('fullwidth');
    } else {
        $('#statistics').collapse('show');
        sketchHolder.removeClass('fullwidth');
        sketchHolder.addClass('right');
    }
}

function toggleDifferenceView() {
    initOptions.showDetails = !initOptions.showDetails;
    if (!initOptions.showDetails) {
        $('#show-details').removeClass('pressed');
        hideDetailsSection();
    } else {
        $('#show-details').addClass('pressed');
    }
}