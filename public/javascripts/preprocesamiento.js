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
        if (!left_map[node.n]) {
            left_map[node.n] = [];
        }
        left_map[node.n].push(node);
        node.moved = false;
        node.equivalent = [];
    });

    rigth_nodes.forEach(function(node) {
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
            if (node.n == eq_node.n && same_author) {
                node.rename = false;
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
        merged: []
    }

    differenceTreeB = {

        added: [],
        removed: [],
        renamed: [],
        moved: [],
        splitted: [],
        merged: []
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
    operations = ['added', 'removed', 'renamed', 'splitted', 'merged', 'moved'];
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

function populateDiffTree(operation, differences, currentLevel, tree) {
    tree[operation].forEach(node => {
        currentLevel = differences;
        for (let index = 0; index < node.f.length; index++) {
            const element = node.f[index];
            if (!currentLevel[element.n]) {
                currentLevel[element.n] = {
                    name: element.n,
                    rank: element.r,
                    changes: {},
                    node: element,
                    children: {}
                };
                currentLevel[element.n].changes[operation] = 1;
            } else {
                currentLevel[element.n].changes && currentLevel[element.n].changes[operation] > 0 ?
                    currentLevel[element.n].changes[operation]++ : currentLevel[element.n].changes[operation] = 1;
            }
            currentLevel = currentLevel[element.n].children;
        }
        if (!currentLevel[node.n]) {
            currentLevel[node.n] = { name: node.n, rank: node.r, node: node, changes: {}, children: {} };
            currentLevel[node.n].changes[operation] = 1;
        } else {
            currentLevel[node.n].changes[operation] > 0 ? currentLevel[node.n].changes[operation]++ : currentLevel[node.n].changes[operation] = 1;;
        }
    });
}

//compare actor of nodes
function compare_author(first_author, second_author) {
    if (first_author.length != second_author.length) {
        return false;
    } else {
        for (
            let author_slot = 0; author_slot < first_author.length; author_slot++
        ) {
            if (first_author[author_slot] != second_author[author_slot]) {
                //console.log({first_author,second_author});
                return false;
            }
        }
        return true;
    }
}

//compares author date of two nodes
function compare_author_date(first_author, second_author) {
    if (
        first_author.a.length != second_author.a.length ||
        first_author.ad.length != second_author.ad.length
    ) {
        return false;
    } else {
        for (
            let author_slot = 0; author_slot < first_author.a.length; author_slot++
        ) {
            if (first_author.a[author_slot] != second_author.a[author_slot]) {
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