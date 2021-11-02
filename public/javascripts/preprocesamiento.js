//constant with the ranks to take into consideration for tasks
const families = [
    'phylum',
    'class',
    'order',
    'superfamily',
    'family',
    'subfamily',
    'tribe',
    'subtribe',
    'genus',
    'subgenus',
    'species',
    'infraspecies',
    'subspecies',
];

differenceTreeA = undefined;
differenceTreeB = undefined;
differencesAdded = undefined;
differencesRemoved = undefined;
differencesMerged = undefined;
differencesSplit = undefined;
differencesRenamed = undefined;
changesMax = undefined;
var filteredTrees = {};
maxPerChange = {};
var taxaNames = {};
//todo tasks:
/**
 * -Some nodes ares spliting and merging at the same time
 *
 *
 */

//calculate splits 
//calculate removes adds moves
// moved means that node moved, if the node has an equivalent the node persists
async function verificar_name_changes(left_nodes, rigth_nodes) {
    let left_map = {};
    let rigth_map = {};

    //initialization and mapping of every node in the hierarchy
    left_nodes.forEach(function(node) {
        taxaNames[node.n] = true;
        if (!left_map[node.n]) {
            left_map[node.n] = [];
        }
        left_map[node.n].push(node);
        node.moved = false;
        node.isRight = false;
        node.equivalent = [];
    });

    rigth_nodes.forEach(function(node) {
        node.isRight = true;
        if (!taxaNames[node.n]) {
            taxaNames[node.n] = true;
        }
        if (!rigth_map[node.n]) {
            rigth_map[node.n] = [];
        }
        rigth_map[node.n].push(node);
        node.moved = false;
        node.equivalent = [];
    });
    //search for new nodes, and moves

    left_nodes.forEach(node => {
        let equivalentArray = rigth_map[node.n];
        if (equivalentArray) {
            equivalentArray.forEach(equivalent => {
                if (equivalent && compare_author_date(node, equivalent)) {
                    node.equivalent.push(equivalent);
                    //Compare the parent of each node, check if parents changed
                    if (
                        node.f.length > 0 &&
                        equivalent.f[equivalent.f.length - 1].n !=
                        node.f[node.f.length - 1].n
                    ) {
                        node.moved = true;
                        equivalent.moved = true;
                        //increase move counter for familiar nodes
                        node.f.forEach(function(familiar) {
                            familiar.totalMoves++;
                        });
                    }
                }
            });
        }
    });

    rigth_nodes.forEach(node => {
        let equivalentArray = left_map[node.n];
        if (equivalentArray) {
            equivalentArray.forEach(equivalent => {
                if (equivalent && compare_author_date(node, equivalent)) {
                    node.equivalent.push(equivalent);

                    //equivalent.equivalent.push(node);
                    //Compare the parent of each node, check if parents changed
                    if (
                        node.f.length > 0 &&
                        equivalent.f[equivalent.f.length - 1].n !=
                        node.f[node.f.length - 1].n
                    ) {
                        node.moved = true;
                        equivalent.moved = true;
                        differenceTreeB.moved.push(node);
                        //increase move counter for familiar nodes
                        node.f.forEach(function(familiar) {
                            familiar.totalMoves++;
                        });
                    }
                }
            });
        }
    });

    //compare nodes to other node synonyms
    //add synonym to node
    left_nodes.forEach(function(node) {
        node.s.forEach(function(synonym) {
            //console.log(synonym);
            let synonym_node_array = rigth_map[synonym.n];
            if (synonym_node_array)
                synonym_node_array.forEach(synonym_node => {
                    if (
                        synonym_node &&
                        compare_author_date(node, synonym_node) &&
                        node.n != synonym.n
                    ) {
                        if (!containsObject(node, synonym_node.equivalent)) {
                            node.equivalent.push(synonym_node);
                            synonym_node.equivalent.push(node);
                        }
                    }
                });
        });
    });

    //add synonim to node
    rigth_nodes.forEach(function(node) {
        node.s.forEach(function(synonym) {
            let synonym_node_array = left_map[synonym.n];
            if (synonym_node_array)
                synonym_node_array.forEach(synonym_node => {
                    if (
                        synonym_node &&
                        compare_author_date(node, synonym_node) &&
                        node.n != synonym.n
                    ) {
                        if (!containsObject(node, synonym_node.equivalent)) {
                            node.equivalent.push(synonym_node);
                            synonym_node.equivalent.push(node);
                        }
                    }
                });
        });
    });

    //console.log({"synonyms_left" : synonyms_left, "synonyms_rigth" : synonyms_rigth});
    //return {"synonyms_left" : synonyms_left, "synonyms_rigth" : synonyms_rigth};
}

//preguntar sobre el conteo de splits
//tasks like merges and splits stop being exclusive
function name_changes_left(node_list) {
    node_list.forEach(function(node) {
        let equivalence = node.equivalent.length;

        //check for merge ---------------------------------------------------------------------------------------
        if (equivalence > 1) {
            //console.log(node);
            node.f.forEach(function(familiar) {
                familiar.totalSplits++;
            });
            node.split = true;
            differenceTreeA.splitted.push(node);
        } else if (equivalence == 1 && !node.moved) {
            let eq_node = node.equivalent[0];
            let same_author = compare_author(node.a, eq_node.a);

            /* Renames in the old tree can be caused by merges  See case
            Amphitrite affinis  -> Neoamphitrite affinis
            */
            //check for  rename ----------------------------------------------------------------------------------
            // if (node.n == eq_node.n && same_author) {
            //     node.rename = false;
            // } else {
            //     node.rename = true;
            //     renames.push(node.n,eq_node.n);
            //     differenceTreeA.renamed.push(node);
            //     node.f.forEach(function(familiar) {
            //         familiar.totalRenames++;
            //     });
            // }
            //check for remove ---------------------------------------------------------------------------------------
        } else if (equivalence == 0) {
            node.rename = false;
            differenceTreeA.removed.push(node);
            node.f.forEach(function(familiar) {
                familiar.totalRemoves++;
            });
        }
    });
}

//try to store info on left side
//preguntar sobre el conteo de merges
function name_changes_right(node_list) {
    node_list.forEach(function(node) {
        let equivalence = node.equivalent.length;
        //check for merge ---------------------------------------------------------------------------------------
        if (equivalence > 1) {
            node.f.forEach(function(familiar) {
                familiar.totalMerges++;
            });
            node.merge = true;
            differenceTreeB.merged.push(node);
        } else if (equivalence == 1 && !node.moved) {
            let eq_node = node.equivalent[0];
            let same_author = compare_author(node.a, eq_node.a);

            //check for  rename ----------------------------------------------------------------------------------
            if (node.n == eq_node.n) {
                node.rename = false;
                if (!same_author) {
                    node.authorChanged = true;
                    differenceTreeB.authorChanged.push(node);
                    node.f.forEach(function(familiar) {
                        familiar.totalAuthorChanges++;
                    });
                }
            } else {
                node.rename = true;
                differenceTreeB.renamed.push(node);
                node.f.forEach(function(familiar) {
                    familiar.totalRenames++;
                });
            }
            //check for remove ---------------------------------------------------------------------------------------
        } else if (equivalence == 0) {
            node.added = true;
            differenceTreeB.added.push(node);
            node.f.forEach(function(familiar) {
                familiar.totalInsertions++;
            });
        }
    });
}

//executes task searching functions for each rank

function calculate_all_merges(left_tree, rigth_tree) {
    differenceTreeA = {
        added: [],
        removed: [],
        renamed: [],
        moved: [],
        splitted: [],
        merged: [],
        authorChanged: []
    }

    differenceTreeB = {

        added: [],
        removed: [],
        renamed: [],
        moved: [],
        splitted: [],
        merged: [],
        authorChanged: []
    }
    families.forEach(function(rank) {
        verificar_name_changes(left_tree[rank], rigth_tree[rank]);
        name_changes_left(left_tree[rank]);
        name_changes_right(rigth_tree[rank]);
    });
    differences = generateDiffTree();

}

/**
 *  A Function that runs over the trees to generate the 
 *  differences tree hierarchy
 * @param {*} operation 
 * @returns 
 */
function generateDiffTree() {
    filteredTrees = {};
    differences = {};
    currentLevel = differences;
    operations = ['added', 'removed', 'renamed', 'splitted', 'merged', 'moved', 'authorChanged'];
    operations.forEach(op => populateDiffTree(op, differences, currentLevel, differenceTreeA));
    operations.forEach(op => populateDiffTree(op, differences, currentLevel, differenceTreeB));
    const result = [];
    changesMax = {};
    convertToTree(differences, result);
    return result.pop();
}

function convertToTree(structure, root) {
    const elems = Object.keys(structure);
    elems.forEach(element => {
        const diffNode = structure[element];
        diffNode.c = diffNode.c || [];
        const rankMax = Object.values(diffNode.changes).reduce((a, b) => a + b);
        changesMax[diffNode.rank] = changesMax[diffNode.rank] ?
            changesMax[diffNode.rank] > rankMax ? changesMax[diffNode.rank] : rankMax : rankMax;
        if (diffNode.rank === "Family") {
            Object.keys(diffNode.changes).forEach(element => {
                maxPerChange[element] = maxPerChange[element] && maxPerChange[element].changes[element] >
                    diffNode.changes[element] ? maxPerChange[element] : diffNode;
            });
        }
        convertToTree(diffNode.children, diffNode.c);
        root.push(diffNode);
    });
}

function nodeUID(node) {
    return node.n + node.a.join(',') + node.ad.join(',');
}

function populateDiffTree(operation, differences, currentLevel, tree) {
    tree[operation].forEach(node => {
        currentLevel = differences;
        for (let index = 0; index < node.f.length; index++) {
            const element = node.f[index];
            if (!currentLevel[nodeUID(element)]) {
                currentLevel[nodeUID(element)] = {
                    name: element.n,
                    rank: element.r,
                    changes: {},
                    node: element,
                    children: {}
                };
                currentLevel[nodeUID(element)].changes[operation] = 1;
            } else {
                const currNode = currentLevel[nodeUID(element)];
                currNode.changes && currNode.changes[operation] > 0 ?
                    currNode.changes[operation]++ : currNode.changes[operation] = 1;
            }
            currentLevel = currentLevel[nodeUID(element)].children;
        }
        if (!currentLevel[nodeUID(node)]) {
            currentLevel[nodeUID(node)] = { name: node.n, rank: node.r, node: node, changes: {}, children: {} };
            currentLevel[nodeUID(node)].changes[operation] = 1;
        } else {
            currentLevel[nodeUID(node)].changes[operation] > 0 ? currentLevel[nodeUID(node)].changes[operation]++ : currentLevel[nodeUID(node)].changes[operation] = 1;;
        }
    });
}

/**
 * Remove spaces and points
 * @param {*} value 
 * @returns 
 */
function normalizeAuthorData(value) {
    return value.replaceAll(' ', '').replaceAll('.', '');
}
//compare actor of nodes
function compare_author(first_author, second_author) {
    if (first_author.length != second_author.length) {
        return false;
    } else {
        for (
            let author_slot = 0; author_slot < first_author.length; author_slot++
        ) {
            const firstA = first_author[author_slot]; // normalizeAuthorData(first_author[author_slot]);
            const secondA = second_author[author_slot]; //normalizeAuthorData(second_author[author_slot]);
            //if (!firstA.includes(secondA) || stringSimilarity.compareTwoStrings(firstA, secondA) < 0.6) {
            if (firstA !== secondA) {
                // console.log({ firstA, secondA });
                return false;
            }
        }
        return true;
    }
}

//compares author date of two nodes
function compare_author_date(first_author, second_author) {
    if (
        first_author.a.length != second_author.a.length || // Same amount of authors
        first_author.ad.length != second_author.ad.length // Same date length
    ) {
        return false;
    } else {
        for (
            let author_slot = 0; author_slot < first_author.a.length; author_slot++
        ) {
            const firstA = first_author.a[author_slot]; //normalizeAuthorData(first_author.a[author_slot]);
            const secondA = second_author.a[author_slot]; //normalizeAuthorData(second_author.a[author_slot]);
            //if (!firstA.includes(secondA) || stringSimilarity.compareTwoStrings(firstA, secondA) < 0.6) {
            if (firstA !== secondA && first_author.n !== second_author.n) {
                //     ////console.log({ firstA, secondA });
                return false;
            }
        }
        for (
            let author_slot = 0; author_slot < first_author.ad.length; author_slot++
        ) {
            if (first_author.ad[author_slot] != second_author.ad[author_slot]) {
                return false;
            }
        }
        return true;
    }
}

//helper function
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }

    return false;
}