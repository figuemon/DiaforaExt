    var rowConverter = function(d) {
        return {
            id: d.id,
            parentId: (d.parentId !== "" && d.parentId !== "NULL" && d.parentId !== undefined) ? d.parentId : null,
            label: (d.label !== "" && d.label !== "NULL" && d.label !== undefined) ? d.label : null,
        };
    }

    var svgTree;

    var margin = { top: 30, right: 20, bottom: 30, left: 20 },
        width = 960,
        barHeight = 20,
        barWidth = (width - margin.left - margin.right) * 0.35;

    var i = 0,
        duration = 400,
        root,
        data;
    const infoSVGPath = "M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z";

    var diagonal = d3.linkHorizontal()
        .x(function(d) { return d.y; })
        .y(function(d) { return d.x; });

    function loadTree(data) {
        svgTree = d3.select(".treeContainer").append("svg")
            .attr("width", width) // + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        svgTree.node().classList.add("svgIndentedTree");
        root = d3.hierarchy(data, d => Array.isArray(d.c) ? d.c : undefined);
        root.x0 = 0;
        root.y0 = 0;
        update(root);
    }

    function searchForNodes(d, searchValue) {
        let matches = [];
        if (d && searchValue.length && searchValue.length > 0) {
            for (var i = 0, len = d.length; i < len; i++) {
                if (d[i].label.toUpperCase().includes(`${searchValue.toUpperCase()}`)) {
                    matches.push(d[i]);
                }
            };
        };
        return (matches.length > 0) ? matches : null;
    };

    function getParentNode(d, node) {
        let parentNode = null;
        d.forEach(n => {
            if (node.parentId === n.id) {
                parentNode = n;
            }
        })
        return parentNode;
    };

    function getDirectChildrenNodes(d, node) {
        let childNodes = [];
        d.forEach(n => {
            if (node.id === n.parentId) {
                childNodes.push(n);
            }
        })
        return childNodes;
    }

    function filterData(d, searchValue) {
        let filteredData = [];
        const matchedNodes = searchForNodes(d, searchValue);
        if (matchedNodes) {
            matchedNodes.forEach((n, i) => {
                (!filteredData.includes(matchedNodes[i])) ? filteredData.push(matchedNodes[i]): null;
                let parentNode = getParentNode(d, matchedNodes[i]);
                while (parentNode) {
                    (!filteredData.includes(parentNode)) ? filteredData.push(parentNode): null;
                    parentNode = getParentNode(d, parentNode);
                };
                getDirectChildrenNodes(d, matchedNodes[i]).forEach(cn => {
                    (!filteredData.includes(cn)) ? filteredData.push(cn): null;
                });
            });
        }
        return filteredData;
    }

    function update(source) {

        //expand all button click
        d3.select('.btn-expand-all')
            .on('click', function() {
                expandAll(root);
                update(root);
            });

        //collapse all button click
        d3.select('.btn-collapse-all')
            .on('click', function() {
                expandAll(root);
                collapseAll(root);
                root.children = root._children;
                root._children = null;
                update(root);
            });

        var nodes = root.descendants();

        var height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);

        d3.select(".svgIndentedTree").transition()
            .duration(duration)
            .attr("height", height);

        d3.select(self.frameElement).transition()
            .duration(duration)
            .style("height", height + "px");

        // Compute the "layout"
        var index = -1;
        root.eachBefore(function(n) {
            n.x = ++index * barHeight;
            n.y = n.depth * barHeight;
        });

        // Update the nodes…
        var node = svgTree.selectAll(".node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .style("opacity", 0);

        // Enter any new nodes at the parent's previous position.
        nodeEnter.append("rect")
            .attr("y", -barHeight / 2)
            .attr("height", barHeight)
            .attr("width", barWidth)
            .style("fill", rectFill)
            .on("mouseover", rectMouseOver)
            .on("click", (e, d) => { rectClick(d) });

        nodeEnter.append("text")
            .classed('label', true)
            .attr("dy", 3.5)
            .attr("dx", 5.5)
            .attr('fill', textFill)
            .text(function(d) { return (d.data.rank + " " + d.data.name) })
        console.log(`scale(${.03})translate(${barWidth-5.5},-${barHeight/2})`)
        nodeEnter.append("path")
            .classed('info-icon', true)

        .attr('transform', `translate(${barWidth-21.5},-${barHeight*.39}) scale(${.03})`)
            .attr('fill', textFill)
            .attr('d', infoSVGPath)
            .attr('opacity', .35)
            .on("mouseover", infoMouseOver)
            .on("click", infoClick);

        // Transition nodes to their new position.
        nodeEnter.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1);


        node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1)
            .select("rect")
            .style("fill", rectFill);

        // Transition exiting nodes to the parent's new position.
        node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .style("opacity", 0)
            .remove();

        // Update the links…
        var link = svgTree.selectAll(".link")
            .data(root.links(), function(d) { return d.target.id; });


        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
            })
            .remove();

        // Stash the old positions for transition.
        root.each(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function rectClick(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    function infoClick(d) {
        function toTitleCase(str) {
            return str.replace(
                /\w\S*/g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        }
        alert(`Unit data for '${toTitleCase(d.data.data.label)}' will appear to the right`);
    }

    function rectFill(d) {
        return d._children ? "#34516D" : d.children ? "#5584b1" : "#dcdcdc";
    }

    function textFill(d) {
        return d._children ? "#ffffff" : d.children ? "#ffffff" : "#000000";
    }

    function rectMouseOver(d) {
        d3.select(this).attr('cursor', (d) => d._children ? 'pointer' : d.children ? 'pointer' : "default");
    }

    function infoMouseOver(d) {
        d3.select(this).attr('cursor', 'pointer');
    }

    function expandAll(node) {
        node.descendants().forEach(dn => {
            if (dn._children) {
                dn.children = dn._children;
                dn._children = null;
                expandAll(dn);
            }
        })
    };

    function collapseAll(node) {
        node.descendants().forEach(dn => {
            if (dn.children) {
                dn._children = dn.children;
                dn.children = null;
                collapseAll(dn);
            }
        })
    }

    function handleSearchClick() {
        const searchVal = d3.select('#searchVal').node().value;

        let filteredData = filterData(data, searchVal);

        filteredData = (filteredData.length > 0) ? filteredData : [];

        formatSearchResult(filteredData, searchVal);

        if (filteredData.length < 1) return;

        let stratifiedData = d3.stratify()
            .id(function(d) { return d.id; })
            .parentId(function(d) { return d.parentId; })
            (filteredData)

        root = d3.hierarchy(stratifiedData);
        root.x0 = 0;
        root.y0 = 0;

        update(root);
    };

    function handleSearchEnter(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            handleSearchClick();
        }
    }

    function handleNodeThresholdCountChange() {
        const searchVal = d3.select('#searchVal').node().value;
        const nodeThresholdCount = d3.select('#nodeThresholdCount').node().value;

        let filteredData = (filterData(data, searchVal).length > 0) ? filterData(data, searchVal) : data;

        if (filteredData.length <= nodeThresholdCount) return;

        filteredData = filteredData.filter((d, i) => i < nodeThresholdCount);

        if (filteredData.length < 1) return;

        let stratifiedData = d3.stratify()
            .id(function(d) { return d.id; })
            .parentId(function(d) { return d.parentId; })
            (filteredData)

        root = d3.hierarchy(stratifiedData);
        root.x0 = 0;
        root.y0 = 0;

        update(root);
    }

    function formatSearchResult(filteredData, searchVal) {
        const searchProvided = searchVal.length > 0;
        const searchFound = (filteredData && filteredData.length > 0);
        const multipleSearchesFound = (searchFound && filteredData.length > 1);
        d3.select('#span-result')
            .classed('search-found', searchFound)
            .classed('search-not-found', searchProvided && !searchFound)
            .html(function() {
                    return searchProvided ? `'${searchVal}' ${searchFound ? multipleSearchesFound ? `produced multple matches` : 'produced a match' : 'did not produce a match'}` : 'No search criteria provided'
        });
};

function onSearchInput() {
    if (d3.select('#searchVal').node().value && d3.select('#searchVal').node().value.length > 0) {
        d3.select('#btn-Submit').property('disabled', false);
        d3.select('#nodeThresholdCountLable').classed('disabled', true);
        d3.select('#nodeThresholdCount').property('disabled', true);
    }
    else {
        d3.select('#btn-Submit').property('disabled', true);
        d3.select('#nodeThresholdCountLable').classed('disabled', false);
        d3.select('#nodeThresholdCount').property('disabled', false);

        const nodeThresholdCount = d3.select('#nodeThresholdCount').node().value;

        let filteredData = data.filter((d, i) => i < nodeThresholdCount);

        formatSearchResult(null, '');

        let stratifiedData = d3.stratify()
            .id(function (d) { return d.id; })
            .parentId(function (d) { return d.parentId; })
            (filteredData)

        root = d3.hierarchy(stratifiedData);
        root.x0 = 0;
        root.y0 = 0;

        update(root);
    }
}

function sortHierarchyData(data) {

    let d = data.sort((a, b) => a.label.localeCompare(b.label));
    const root = d.filter(n => n.parentId === null)[0];

    let sortedData = [root];

    sortHierarchy([root], d, sortedData);

    return sortedData;
}

function sortHierarchy(nodes, d, sortedData) {
    if (nodes) {
        nodes.forEach(n => {
            d.forEach(pcn => {
                if (n.id === pcn.parentId && !sortedData.includes(pcn)) {
                    sortedData.push(pcn);
                    if (nodeHasChildren(pcn, d)) {
                        sortHierarchy([pcn], d, sortedData);
                    }
                }
            })
        })
    }
}

function nodeHasChildren(node, d) {
    let hasChildren = false;
    d.forEach(n => {
        if (n.parentId === node.id) {
            hasChildren = true;
        }
    })
    return hasChildren;
}