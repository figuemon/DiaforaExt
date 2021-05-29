const loadingUrl = host;

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
    bundling: 0.5,
    changedLines: false,
    secondaryFilter: false
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

function optionMenuChange() {
    interface_variables.secondaryFilter = true;
    document.getElementById('busyLoader').style.display = 'block';
    setTimeout(() => {
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