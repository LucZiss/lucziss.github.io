var units = "dependance(s)";

var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

var svgPadding = {
    top: 55,
    right: 35,
    bottom: 60,
    left: 25
};

var svg = d3.select("body").append("svg")
    .attr("id", "chart")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .style("display", "inline-block")
    .attr("transform",
        "translate(" + svgPadding.left + "," + svgPadding.top + ")");

var imageVisualization = d3.select("svg").append("image")
    .attr("width", "350px")
    .attr("xlink:href", "flowered_wall/flowered_wall_1k.png");

var sankey = d3.sankey()
    .nodeWidth(100)
    .nodePadding(2)
    .size([width - svgPadding.right - svgPadding.left, height - svgPadding.bottom]);

var path = sankey.link();
var graph = {
    "nodes": [],
    "links": []
};

d3.json("flowered_wall_1k.json").then(function(json) {

    var hierarchy = d3.hierarchy(json).descendants();
    var nodes = hierarchy.map(function(d, i) {
        d.data.depth = d.depth;
        d.data.parent = d.parent ? d.parent.data : null;
        d.data.height = d.height;
        return d = d.data;
    });
    var root = nodes[0];
    var links = getLinks(d3.hierarchy(json));
    var graph = {
        "nodes": mergeWithSameId(nodes),
        "links": removeDuplicateLinksWithID(formatLinksWithIDs(links))
    };

    // computeDescendingLinkValues(graph.links, root);

    sankey.nodes(graph.nodes)
        .links(graph.links)
        .layout(32);


    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d) {
            return Math.max(1, d.dy);
        })
        .sort(function(a, b) {
            return b.dy - a.dy;
        });

    link.append("title")
        .text(function(d, i) {
            return d.value;
        })

    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("width", sankey.nodeWidth())
        .call(d3.drag()
            .clickDistance(5)
            .on("drag", dragmove)
        );

    node.on("mouseover", function(d, i) {
            node.style("opacity", 0.2);
            link.style("opacity", 0.2);
            imageVisualization.attr("xlink:href", "/flowered_wall/" + d.image.slice(0, -4) + "_full.png");
            valoriseParents(root, d);
            valoriseChildren(d);
        })
        .on("mouseout", function(d, i) {
            applyDefaultStyle();
            imageVisualization.attr("xlink:href", "/flowered_wall/flowered_wall_1k.png");
        });

    var nodeRects = node.append("rect")
        .attr("height", function(d) {
            return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .attr("rx", 2)
        .attr("ry", 2)
        .style("fill", function(d) {
            return "#" + d.color;
        })
        .style("stroke", function(d) {
            return "#" + d.color;
        });

    var nodeImages = node.append("image")
        .attr("height", function(d) {
            return Math.max(1, d.dy);
        })
        .attr("width", sankey.nodeWidth())
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("xlink:href", function(d) {
            return '/flowered_wall/' + d.image;
        });






})

function dragmove(d) {
    d3.select(this)
        .attr("transform",
            "translate(" +
            d.x + "," +
            (d.y = Math.max(-margin.top - svgPadding.top, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    d3.selectAll(".link").attr("d", path);
}

function getLinks(root) {
    var links = [];
    getLinksRec(root.data);

    function getLinksRec(node) {
        if (node.children) {
            node.children.forEach(function(d, i) {
                links.push({
                    "source": node,
                    "target": d,
                    "value": d.value
                });
                getLinksRec(d);
            })
        }
    }
    return links;
}

function formatLinksWithIDs(links) {
    var linkIDs = links.map(function(d, i) {
        d.source = d.source.id;
        d.target = d.target.id;
        return d;
    });
    return linkIDs;
}


function getAllNodesWithID(nodes, Id) {
    var nodesWithId = [];
    nodes.forEach(function(d, i) {
        if (d.data.id === id) {
            nodesWithId.push(d.data)
        }
    })
    return nodesWithId;
}

function mergeWithSameId(nodes) {
    var nodeChildrens = {};
    var nodeParents = {};
    var mergedNodes = [];
    nodes.forEach(function(d, i) {
        if (nodeChildrens[d.id]) {
            nodeChildrens[d.id] = nodeChildrens[d.id].concat(getAllChildren(d));
            removeDuplicateChildren(nodeChildrens[d.id]);

        } else {
            nodeChildrens[d.id] = getAllChildren(d);
            mergedNodes.push(Object.assign({}, d)); // copie
        }

        if (nodeParents[d.id]) {
            nodeParents[d.id] = nodeParents[d.id].concat(d.parent);
            removeDuplicateParents(nodeParents[d.id]);

        } else {
            nodeParents[d.id] = [d.parent];
        }
    })
    mergedNodes.forEach(function(d, i) {
        d.children = nodeChildrens[d.id];
        d.parent = nodeParents[d.id];

    });
    return mergedNodes;
}

function removeDuplicateChildren(children) {
    var childFlag = {};
    for (var i = 0; i < children.length; i++) {

        if (childFlag[children[i].id]) {
            children.splice(children.indexOf(children[i]), 1);
            i--;
        } else {
            childFlag[children[i].id] = true;
        }
    }
}

function removeDuplicateParents(parents) {
    var parentFlag = {};
    for (var i = 0; i < parents.length; i++) {

        if (parentFlag[parents[i].id]) {
            parents.splice(parents.indexOf(parents[i]), 1);
            i--;
        } else {
            parentFlag[parents[i].id] = true;
        }
    }
}


function getAllChildren(node) {
    var nodeChildren = [];
    if (node.children) {
        node.children.forEach(function(d, i) {
            nodeChildren.push(d);
        })
    }
    return nodeChildren;
}

function getNodeById(nodes, id) {
    var node;
    nodes.forEach(function(d, i) {
        if (d.id === id) {
            node = d;
            return;
        }
    })
    return node;
}

function removeDuplicateLinksWithID(links) {
    var linkFlags = {};
    for (var i = 0; i < links.length; i++) {
        if (linkFlags[links[i].source + "" + links[i].target]) {
            linkFlags[links[i].source + "" + links[i].target].value += links[i].value;
        } else {
            linkFlags[links[i].source + "" + links[i].target] = links[i];
        }
    }
    return Object.values(linkFlags);
}


function getParents(root, node) {
    var parents = {
        "nodes": [],
        "links": []
    };
    getParentsRec(root);

    function getParentsRec(nodeRec) {
        if (nodeRec.id === node.id) {
            return true;
        } else if (nodeRec.depth > node.depth) {
            return false;
        }
        var found = false;
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                if (getParentsRec(d)) {
                    parents.nodes.push(nodeRec.id);
                    parents.links.push(getd3LinkFromTo(nodeRec, d));
                    found = true;
                }
            })
        }
        return found;
    }
    return parents;
}

function getChildren(node) {

    var children = {
        "nodes": [],
        "links": []
    };
    getChildrenRec(node);

    function getChildrenRec(nodeRec) {
        children.nodes.push(nodeRec.id);
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                children.links.push(getd3LinkFromTo(nodeRec, d))
                getChildrenRec(d);
            })
        }
    }
    return children;
}

function getd3LinkFromTo(nodeA, nodeB) {
    var link;
    d3.selectAll(".link").data().forEach(function(d, i) {
        if (d.source.id === nodeA.id && d.target.id === nodeB.id) {
            link = d;
        }
    })
    return link;
}

function getLinkFromTo(links, nodeA, nodeB) {
    var link;
    links.forEach(function(d, i) {
        if (d.source === nodeA.id && d.target === nodeB.id) {
            link = d;
        }
    })
    return link;
}

function valoriseParents(root, node) {
    var parents = getParents(root, node);
    d3.selectAll(".node").filter(function(d, i) {
        return parents.nodes.includes(d.id) || d === node;
    }).style("opacity", 1);
    d3.selectAll(".link").filter(function(d, i) {
            return parents.links.includes(d);
        }).style("opacity", 1)
        .style("stroke", "#005bef");
}

function valoriseChildren(node) {
    var children = getChildren(node);
    d3.selectAll(".node").filter(function(d, i) {
        return children.nodes.includes(d.id) || d === node;
    }).style("opacity", 1);
    d3.selectAll(".link").filter(function(d, i) {
            return children.links.includes(d);
        }).style("opacity", 1)
        .style("stroke", "#b200ff");
}

function computeDescendingLinkValues(links, root) {
    var previousValue = 1;
    computeDescendingLinkValuesRec(root, previousValue);

    function computeDescendingLinkValuesRec(node, previousValue) {
        if (node.children) {
            node.children.forEach(function(d, i) {
                var link = getLinkFromTo(links, node, d);
                var initialValue = previousValue;
                link.value *= previousValue;
                previousValue = link.value;
                computeDescendingLinkValuesRec(d, previousValue);
                previousValue = initialValue;
            })
        }
    }
}

function applyDefaultStyle() {
    applyDefaultOpacity();
    applyDefaultLinkColor();
}

function applyDefaultOpacity() {
    d3.selectAll(".link")
        .style("opacity", "1");
    d3.selectAll(".node")
        .style("opacity", "1");
}

function applyDefaultLinkColor() {
    d3.selectAll(".link")
        .style("stroke", "#000");
}
