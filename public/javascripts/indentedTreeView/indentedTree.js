    var rowConverter = function(d) {
        return {
            id: d.id,
            parentId: (d.parentId !== "" && d.parentId !== "NULL" && d.parentId !== undefined) ? d.parentId : null,
            label: (d.label !== "" && d.label !== "NULL" && d.label !== undefined) ? d.label : null,
        };
    }

    var svgTree;

    var indentedTreeState = {};

    var margin = { top: 30, right: 20, bottom: 30, left: 20 },
        width = 960,
        barHeight = 20,
        barWidth = 450 //(width - margin.left - margin.right) * 0.35;

    var nodeSize = 17;

    var links = [];
    var i = 0,
        duration = 400,
        root,
        data;
    const infoSVGPath = "M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 5 7h2.5V6A1.5 1.5 0 0 1 6 4.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM3 11.5A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z";

    var diagonal = d3.linkHorizontal()
        .x(function(d) { return d.y; })
        .y(function(d) { return d.x; });

    function connector(d) {
        const sourceIndex = d.source.x;
        const targetIndex = d.target.x;
        const depth = d.source.depth || 0;
        const childIndex = d.source.children ? d.source.children.indexOf(d.target) : 0;
        const initialOffset = d.source.children && childIndex > 0 ?
            d.source.children[childIndex - 1].x : sourceIndex;
        return `M${depth * 10},${initialOffset}
                    V${ targetIndex }
                    h${d.target.y - (depth * 10) }`


    }

    function applyFilters(d, filters) {
        let sum = 0;
        sum += filters[0] === "1" ? d.data.changes['added'] : 0;
        sum += filters[1] === "1" ? d.data.changes['removed'] : 0;
        sum += filters[2] === "1" ? d.data.changes['splitted'] : 0;
        sum += filters[3] === "1" ? d.data.changes['merged'] : 0;
        sum += filters[4] === "1" ? d.data.changes['moved'] : 0;
        sum += filters[5] === "1" ? d.data.changes['renamed'] : 0;
        return sum;
    }

    async function loadTree(data, tooltipContent, filters, detailsFn) {
        d3.select(".treeContainer").html(""); //Clean previous tree
        if (filters != "000000") {
            const ds = d3.hierarchy(data, d => Array.isArray(d.c) ? d.c : undefined);
            const sorted = ds.sort((a, b) => applyFilters(b, filters) - applyFilters(a, filters));

            svgTree = d3.select(".treeContainer").append("svg")
                .attr("class", "svgIndentedTree")
                .attr("width", width) // + margin.left + margin.right)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            root = sorted;
            root.x0 = 0;
            root.y0 = 0;
            update(root, detailsFn);

            svgTree.append('g'); // tooltips
            indentedTreeState.tooltip = d3.select(".treeContainer").append('div').attr('class', 'sunburst-tooltip');
            d3.select(".treeContainer").on('mousemove', function(ev) {
                var mousePos = d3Pointer(ev);
                indentedTreeState.tooltip.style('left', mousePos[0] + 'px').style('top', mousePos[1] + 'px').style('transform', "translate(-".concat(mousePos[0] / width * 100, "%, 21px)")); // adjust horizontal position to not exceed canvas boundaries
            });
            indentedTreeState.tooltipContent = tooltipContent;
        }

    }

    function d3Pointer(event, node) {
        event = sourceEvent(event);
        if (node === undefined) node = event.currentTarget;
        if (node) {
            var svg = node.ownerSVGElement || node;
            if (svg.createSVGPoint) {
                var point = svg.createSVGPoint();
                point.x = event.clientX, point.y = event.clientY;
                point = point.matrixTransform(node.getScreenCTM().inverse());
                return [point.x, point.y];
            }
            if (node.getBoundingClientRect) {
                var rect = node.getBoundingClientRect();
                return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
            }
        }
        return [event.pageX, event.pageY];
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

    function update(source, detailsFn) {

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
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + (source.x0 + 20) + ")"; })
            .style("opacity", 0);

        // Enter any new nodes at the parent's previous position.
        nodeEnter.append("rect")
            .attr("y", -barHeight / 2)
            .attr("height", barHeight)
            .attr("width", (d) => barWidth - (d.y))
            .classed("leafNode", (d) => isLeaf(d.data))
            .style("fill", (d) => rectFill(d))
            .on("mouseover", (e, d) => { rectMouseOver(e, d) })
            .on("mouseleave", (d) => hideTooltip(d))
            .on("click", (e, d) => { rectClick(d) });

        var barindicator = nodeEnter.append("g")
            .attr("width", barWidth / 2)
            .attr("height", barHeight / 2)
            .on("mouseover", (e, d) => { showTooltipForDistribution(e, d.data) })
            .on("mouseleave", (d) => hideTooltipForDistribution(d));

        barindicator.append(d => {
                var rects = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                if (d.data.c.length > 0) {
                    var keys = Object.keys(d.data.changes);
                    var maxScope = Object.values(d.data.changes).reduce(function(a, b) {
                        return a + b;
                    });
                    let currentXPos = (barWidth - barWidth / 2) - d.y;
                    keys.forEach(function(element) {
                        var percentage = d.data.changes[element] / maxScope;
                        var distance = (barWidth / 3) * percentage;
                        var displayP = Number(percentage * 100).toFixed(1);
                        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('width', distance);
                        rect.setAttribute('height', barHeight / 4);
                        rect.setAttribute('y', -barHeight / 4);
                        rect.setAttribute('x', currentXPos);
                        rect.setAttribute('style',
                            `fill: ${colorsBars(element)}; stroke-width:0px;`
                        );
                        rects.appendChild(rect);
                        currentXPos += distance;
                    });
                }
                return rects;
            }

        );

        nodeEnter.append("text")
            .classed('label', true)
            .attr("dy", 3.5)
            .attr("dx", 5.5)
            .attr('fill', textFill)
            .text(function(d) { return (d.data.rank + " " + d.data.name) })

        nodeEnter.filter((d) => d.data.rank === "Family" && maxPerChange['splitted'] && d.data.name == maxPerChange['splitted'].name)
            .append('circle')
            .attr('cx', 345)
            .attr('cy', 1)
            .attr('r', '3px')
            .style('fill', colorsBars('splitted'));
        nodeEnter.filter((d) => d.data.rank === "Family" && maxPerChange['merged'] && d.data.name == maxPerChange['merged'].name)
            .append('circle')
            .attr('cx', 353)
            .attr('cy', 1)
            .attr('r', '3px')
            .style('fill', colorsBars('merged'));
        nodeEnter.filter((d) => d.data.rank === "Family" && maxPerChange['moved'] && d.data.name == maxPerChange['moved'].name)
            .append('circle')
            .attr('cx', 361)
            .attr('cy', 1)
            .attr('r', '3px')
            .style('fill', colorsBars('moved'));
        nodeEnter.filter((d) => d.data.rank === "Family" && maxPerChange['renamed'] && d.data.name == maxPerChange['renamed'].name)
            .append('circle')
            .attr('cx', 369)
            .attr('cy', 1)
            .attr('r', '3px')
            .style('fill', colorsBars('renamed'));
        nodeEnter.filter((d) => d.data.rank === "Family" && maxPerChange['added'] && d.data.name == maxPerChange['added'].name)
            .append('circle')
            .attr('cx', 377)
            .attr('cy', 1)
            .attr('r', '3px')
            .style('fill', colorsBars('added'));
        nodeEnter.filter((d) => d.data.rank === "Family" && maxPerChange['removed'] && d.data.name == maxPerChange['removed'].name)
            .append('circle')
            .attr('cx', 385)
            .attr('cy', 1)
            .attr('r', '3px')
            .style('fill', colorsBars('removed'));
        const taxIndicator = nodeEnter.append("rect")
            .attr("y", -barHeight / 2)
            .style("fill", "#004c0a")
            .style("opacity", '0.7')
            .attr("height", barHeight)
            .attr("width", 30)
            .on("mouseover", (e, d) => infoMouseOver(d))
            .on("mouseleave", (d) => hideTooltip(d))
            .attr("transform", (d) => `translate(${barWidth - (d.y+30)})`);
        nodeEnter.append("path")
            .classed('info-icon', true)
            .attr("fill", "white")
            .attr('transform', (d) => `translate(${barWidth - (d.y + 21.5)},-${barHeight*.39})`)
            .attr('d', infoSVGPath)
            .on("mouseover", (e, d) => infoMouseOver(d))
            .on("mouseleave", (d) => hideTooltip(d))
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
                var o = { x: source.x0, y: source.y0, index: source.index };
                return connector({ source: o, target: o });
            })
            .transition()
            .duration(duration)
            .attr("d", connector);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", connector);

        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = { x: source.x, y: source.y, index: source.index };
                return connector({ source: o, target: o });
            })
            .remove();
        // Stash the old positions for transition.
        root.each(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function colorsBars(d) {
        switch (d) {
            case "added":
                return "#38B03D";

            case "splitted":
                return "#C700BA";

            case "merged":
                return "#FFA452";

            case "renamed":
                return "#1700E7";

            case "removed":
                return "#D50000";

            default:
                return "#09D3D3";
        }
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
        loadChangeDetailsSection(d.data);
        if (d.data.c.length > 0) {
            update(d);
        }
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

    function rectFill(node) {
        if (interface_variables.added && node.data.changes['added'] === 1 && node.data.c.length == 0) {
            return initOptions['add-color'];
        }
        if (interface_variables.removed && node.data.changes['removed'] === 1 && node.data.c.length == 0) {
            return initOptions['remove-color'];
        }
        if (interface_variables.split && node.data.changes['splitted'] === 1 && node.data.c.length == 0) {
            return initOptions['split-color'];
        }
        if (interface_variables.merge && node.data.changes['merged'] === 1 && node.data.c.length == 0) {
            return initOptions['merge-color'];
        }
        if (interface_variables.move && node.data.changes['moved'] === 1 && node.data.c.length == 0) {
            return initOptions['move-color'];
        }
        if (interface_variables.rename && node.data.changes['renamed'] === 1 && node.data.c.length == 0) {
            return initOptions['rename-color'];
        } else {

            return node._children ? "#a3a3a3" : node.children ? "#949494" : "#dcdcdc";
        }
    }

    function textFill(d) {
        return d._children ? "#000000" : d.children ? "#000000" : "#000000";
    }

    function rectMouseOver(event, d) {
        // d3.select(this).attr('cursor', (d) => d._children ? 'hand' : d.children ? 'pointer' : "default");
        indentedTreeState.tooltip.style('display', 'inline');
        indentedTreeState.tooltip.html("<div class=\"tooltip-title\">".concat(d.data.rank + " " + d.data.name).concat("</div>").concat(indentedTreeState.tooltipContent(d.data)));
    }

    function hideTooltip(d) {
        indentedTreeState.tooltip.style('display', 'none');
    }

    function infoMouseOver(d) {
        // d3.select(this).attr('cursor', 'hand');
        let taxonomy = "";
        d.data.node.f.forEach(item => {
            taxonomy += item.r + ": " + item.n + "<br/>";
        });
        taxonomy += d.data.rank + ": " + d.data.name;
        indentedTreeState.tooltip.style('display', 'inline');
        indentedTreeState.tooltip.html("<div class=\"tooltip-title\">".concat("Taxonomy: ").concat("</div>").concat(taxonomy));
    }

    function sourceEvent(event) {
        let sourceEvent;
        while (sourceEvent = event.sourceEvent) event = sourceEvent;
        return event;
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


/**
 * Shows a tooltip with information
 * OnHover a node
 * @param {*} evt
 * @param {*} text
 */
function showTooltipForDistribution(evt, node) {
    if(verifyContentChart(node) > 0){
    const data = createTooltipData(node);
    let tooltip = document.getElementById("tooltip");
    tooltip.style.display = "block";
    tooltip.style.left = evt.offsetX + 40 + 'px';
    tooltip.style.top = evt.offsetY + 10 + 'px';
    var ctx = $('#tooltipChart');
    var myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            plugins: {
                labels: {
                    render: 'percentage',
                    fontSize: 10,
                    fontStyle: 'bold',
                    fontColor: '#000',
                    fontFamily: '"Lucida Console", Monaco, monospace',
                    overlap: false,
                  },
                 title: {
                    display: true,
                    text: `${node.r}: ${node.n}`,
                    position: 'top'
                }
            }
        }

    });
    currentTooltipNode = node;
    }
  }

  /**
   *  Hides the distribution tooltip
   */
  function hideTooltipForDistribution() {
     var tooltip = document.getElementById("tooltip");
     tooltip.style.display = "none";
     currentTooltipNode = undefined;
  }

  /**
   *  Display the tooltip if the node contains changes
   * @param {*} node
   * @returns
   */
  function verifyContentChart(node) {
      return  Object.values(node.changes).reduce(function(a, b) {
            return a + b;
        });
  }

  /**
   * Creates the tooltip content
   * @param {*} node
   * @returns
   */
  function createTooltipData(node){
      return  {
        labels: [
            'Splits',
            'Merges',
            'Removes',
            'Added',
            'Renames',
            'Moves'
        ],
        datasets: [{
            label: 'Changes Distribution',
            data: [
                node.changes['splitted'],
                node.changes['merged'],
                node.changes['removed'],
                node.changes['added'],
                node.changes['renamed'],
                node.changes['moved'],
            ],
            backgroundColor: [
                initOptions["split-color"],
                initOptions["merge-color"],
                initOptions["remove-color"],
                initOptions["add-color"],
                initOptions["rename-color"],
                initOptions["move-color"]
            ],
            borderColor: [
                initOptions["split-color"],
                initOptions["merge-color"],
                initOptions["remove-color"],
                initOptions["add-color"],
                initOptions["rename-color"],
                initOptions["move-color"]
            ],
            borderWidth: 1
        }]
    };
  }