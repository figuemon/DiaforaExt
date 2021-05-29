const visualizationUrl = 'indented';
const downloadUrl = 'download';

function onDownload() {
    window.location.replace(window.location.href + downloadUrl);
}

function VerificarDatos() {
    var errorText = document.getElementById('error_text');
    var fileInput1 = document.getElementById('file1');
    var fileInput2 = document.getElementById('file2');
    var file1 = fileInput1.files[0];
    var file2 = fileInput2.files[0];

    if (typeof Storage !== 'undefined') {
        // Code for localStorage/sessionStorage.
        if (file1 && file2) {
            readFile(file1, function(resultFile1) {
                //console.log(resultFile1.length);
                sessionStorage.setItem('sessionTree1', resultFile1);
                readFile(file2, function(resultFile2) {
                    sessionStorage.setItem('sessionTree2', resultFile2);
                    let nextURLArr = window.location.href.split('?');
                    let nextURL = nextURLArr[0] + visualizationUrl;
                    if (nextURLArr.length == 2) {
                        nextURL += `?${nextURLArr[1]}`;
                    }
                    window.location.replace(nextURL);
                });
            });
            //window.sessionStorage.file1 = file1;
            //window.sessionStorage.file2 = file2;
            errorText.innerHTML = '';
            //window.location.replace(visualizationUrl);
        } else {
            errorText.innerHTML = 'Please select two taxonomies';
        }
        //console.log("sessionStorage!!!");
    } else {
        errorText.innerHTML =
            'Your Web Browser may be incompatible with this software';
    }
    /*}
	catch{
		alert("Invalid Files");
	}*/
}

function readFile(file, callback) {
    let reader = new FileReader();
    //let content;
    reader.onload = function(evt) {
        //window.sessionStorage.sessionTree1 = evt.target.result;
        //console.log("loaded");
        //console.log(evt.target.result);
        callback(evt.target.result);
    };
    reader.onerror = function(evt) {
        console.log('error reading file');
        document.getElementById('error_text').innerHTML = 'error reading file';
    };
    reader.readAsText(file, 'UTF-8');
}