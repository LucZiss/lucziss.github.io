// Code permettant de generer les noeuds et liens du diagramme de Sankey
d3.sankey = function() {

    var sankey = {},
        nodeWidth = 24, // largeur d'un noeud
        nodePadding = 8, // padding entre deux noeuds
        highestOptionY = window.innerHeight; // option ayant la valeur Y la plus basse, cad l'option la plus haute dans l'affichage
        size = [1, 1], // taille du sankey
        nodes = [], // tableau des noeuds d'UE du sankey
        options = [], // tableau des noeuds d'option du sankey
        links = [], // tableau des liens du sankey
        categories = []
        competences = [];

    // ------ FONCTIONS SETTERS/GETTERS ------
    sankey.nodeWidth = function(_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        return sankey;
    };

    sankey.nodePadding = function(_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
    };

    sankey.highestOptionY = function(_) {
        if (!arguments.length) return highestOptionY;
        highestOptionY = +_;
        return sankey;
    };

    sankey.nodes = function(_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.options = function(_) {
        if (!arguments.length) return options;
        options = _;
        return sankey;
    };

    sankey.links = function(_) {
        if (!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.categories = function(_) {
        if (!arguments.length) return categories;
        categories = _;
        return sankey;
    };

    sankey.competences = function(_) {
        if (!arguments.length) return competences;
        competences = _;
        return sankey;
    };

    sankey.size = function(_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };
    // ------ FIN SETTERS/GETTERS ------

    // Constructeur du sankey
    sankey.layout = function() {
        computeNodeLinks();
        computeNodeBreadths();
        computeNodeDepths();
        computeLinkDepths();
        return sankey;
    };

    // Fonction permettant de recalculer les liens du sankey
    sankey.relayout = function() {
        computeLinkDepths();
        return sankey;
    };

    // Fonction permettant de calculer les balises <path> (svg) des liens
    sankey.link = function() {
        var curvature = .5;

        function link(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                y0 = d.source.y + d.sy + d.dy / 2,
                y1 = d.target.y + d.ty + d.dy / 2;

            if (+d.source.semestre == +d.target.semestre) {
                var x0prim = x0 + 10,
                    x1prim = x1 - 10,
                    y1prim = y1 + 10,
                    ctrPt1 = y1 + 60,
                    ctrPt2 = y1 + 50;

                return "M" + x0 + "," + y0 +
                    "L" + x0prim + "," + y0 +
                    "L" + x0prim + "," + y1 +
                    "C" + x0prim + "," + ctrPt1 +
                    " " + x1prim + "," + ctrPt2 +
                    " " + x1prim + "," + y1 +
                    "L" + x1 + "," + y1;
            } else {
                var xi = d3.interpolateNumber(x0, x1),
                    x2 = xi(curvature),
                    x3 = xi(1 - curvature);

                return "M" + x0 + "," + y0 +
                    "C" + x2 + "," + y0 +
                    " " + x3 + "," + y1 +
                    " " + x1 + "," + y1;
            }
        }

        link.curvature = function(_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

    // Pour chaque noeud, indique ses "sourceLinks" et ses "targetLinks"
    // sourceLinks: tous les liens ayant ce noeud comme source du lien
    // targetLinks: tous les liens ayant ce noeud comme cible du lien
    function computeNodeLinks() {
        nodes.forEach(function(node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function(link) {
            var source = link.source,
                target = link.target;
            if (typeof source === "number") source = link.source = getUEById(nodes, link.source);
            if (typeof target === "number") target = link.target = getUEById(nodes, link.target);
            source.sourceLinks.push(link);
            try {
                target.targetLinks.push(link);
            } catch (e) {
                throw new Error(e.name + " : " + e.message + ".\n" +
                "Peut-être que le fichier json contient une dépendance vers une UE non définie.");
            }
        });
    }

    // Assigne a chaque noeud une position en X en fonction du semestre
    // auquel appartient le noeud d'UE ou d'option
    function computeNodeBreadths() {
        var remainingNodes = nodes,
            nextNodes,
            x = 0;

        var scale = d3.scaleLinear()
            .domain(getMinMaxSemester(nodes))
            .range([0, size[0] - nodeWidth]);

        nodes.forEach(function(node) {
            node.x = scale(+node.semestre);
            node.dx = nodeWidth;
        })

        // Permet de separer, pour les semestres demandant de choisir plusieurs options, en plusieurs noeuds d'options
        for (var i = 0; i < options.length; i++) {
            while(options[i].nbChoix > 1) {
                options[i].nbChoix--;
                var copy = Object.assign({}, options[i]);
                copy.nbChoix = 1;
                options.splice(i, 0, copy);
            }
        }

        options.forEach(function(opt) {
            opt.x = scale(+opt.semestre);
            opt.dx = nodeWidth;
        })
    }

    // Separe les noeuds en fonction du semestre auquel ils appartiennent, puis appelle
    // la fonction de calcul de leur position Y
    function computeNodeDepths() {
        var nodesByBreadth = d3.nest()
            .key(function(d) {
                return d.semestre;
            })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function(d) {
                return d.values;
            });

        initializeNodeDepth(nodesByBreadth);
    }

    // Fonction de calcul de la position Y des noeuds
    // PARAM: [nodesByBreadth]: nest d3 separant les noeuds en fonction de leur semestre
    function initializeNodeDepth(nodesByBreadth) {
        var ky = 9; // coefficient servant a calculer la hauteur des noeuds, des liens, etc...
        var skillList = getSkillList(competences); // liste des competences travaillees par les noeuds
        var lastNode = null;
        var lastNotOptionNode = null;
        var lastNodeSlot = null;
        var lastOptionNode = null;
        var minNodeHeight = 15;

        nodesByBreadth.forEach(function(_nodes) {
            lastNode = null;
            lastNotOptionNode = null;
            lastOptionNode = null;

            var nodes = [];
            nodes = sortNodes(nodes, _nodes);

            nodes.forEach(function(node, i) {
                node.dy = ky * +node.coefficient;
                if (node.dy <= minNodeHeight)
                    node.dy = minNodeHeight;

                if ((lastNode == null || lastNotOptionNode == null) && node.option == "false")
                    node.y = -48;
                else if (node.option == "true" && lastOptionNode == null) {
                    node.y = size[1] - node.dy;
                    if (node.y < highestOptionY)
                        highestOptionY = node.y;
                } else if (node.option == "true") {
                    node.y = lastOptionNode.y - node.dy;
                    if (node.y < highestOptionY)
                        highestOptionY = node.y;
                } else if (node.option == "false") {
                    node.y = lastNotOptionNode.y + lastNotOptionNode.dy + nodePadding;
                } else {
                    node.y = lastNode.y + lastNode.dy + nodePadding;
                }

                if (node.option == "false")
                    lastNotOptionNode = node;
                else
                    lastOptionNode = node;

                lastNode = node;
            });

            var firstSlotPlaced = true;
            options.forEach(function(opt, i) {
                if (+lastNode.semestre == +opt.semestre) {
                    opt.dy = 0.8 * (ky / 5) * skillList.length * +opt.coefficient;
                    if (opt.dy <= minNodeHeight)
                        opt.dy = minNodeHeight;
                    opt.y = (firstSlotPlaced) ?
                        lastNotOptionNode.y + lastNotOptionNode.dy + nodePadding :
                        lastNodeSlot.y + lastNodeSlot.dy + nodePadding;
                    lastNodeSlot = opt;
                    firstSlotPlaced = false;
                }
            });

            nodes = setNodesInitialPosition(nodes);

        });

        links.forEach(function(link) {
            link.dy = ky;
        });
    }

    // Stocke les positions initiales des noeuds dans un attribut specifique
    function setNodesInitialPosition(nodes) {
        nodes.forEach(function(d) {
            d.initialX = d.x;
            d.initialY = d.y;
            return d;
        })
    }

    // PARAM: [nodes]: tableau vide auquel on ajoute les noeuds a trier
    // [entry]: tableau des noeuds a trier
    // RETURN: Tableau des noeuds tries en fonction du bloc auquel ils appartiennent
    function sortNodes(nodes, entry) {

        var nodesArray = d3.nest()
            .key(function(d) {
                return d.option;
            })
            .sortKeys(d3.ascending)
            .key(function(d) {
                return getSortIndexWithCategName(d.categorie);
            })
            .sortKeys(function (a,b) {
                return a - b;
            })
            .entries(entry);

        nodesArray.forEach(function(arr) {
            arr.values.forEach(function(arr2) {
                arr2.values.forEach(function(elem) {
                        nodes.push(elem)
                })
            })
        })
        var firstOptionIndice = -1;
        nodes.forEach(function(node, i) {
            if (node.option === "true" && firstOptionIndice === -1) {
                firstOptionIndice = i;
            }
        })

        if (firstOptionIndice >= 0) {
            var sortedOptions = nodes.slice(firstOptionIndice).sort(sortOptions);
            nodes = nodes.slice(0, firstOptionIndice).concat(sortedOptions);
        }

        return nodes;
    }

    // RETURN: tableau contenant, pour chaque semestre, le nombre d'UE dans chaque bloc
    function ueInBlockBySemester() {
        var semesters = getMinMaxSemester(nodes);
        var tab = [];

        for (var i = semesters[0]; i <= semesters[1]; i++) {
            tab[i] = {};
            categories.forEach(function (categ) {
              tab[i][categ] = 0;
            })
        }

        nodes.forEach(function(node) {
            if (node.option == "false")
                tab[+node.semestre][node.categorie] += +node.coefficient;
        })

        return tab;
    }

    // PARAM: [eachBlockUENumber]: tableau contenant, pour chaque semestre, le nombre d'UE dans chaque bloc
    // RETURN: Tableau contenant le nom de chaque bloc ayant le meme nombre d'UEs dans chaque semestre
    // et devant donc etre positionne tout en haut de l'affichage
    function getFirstBlocksList(eachBlockUENumber) {
        var semesters = getMinMaxSemester(nodes);
        var tab = [];
        var refNumbers = {};
        var booleans = {};
        categories.forEach(function (categ) {
          refNumbers[categ] = eachBlockUENumber[semesters[0]][categ];
          booleans[categ] = true;
        })

        eachBlockUENumber.forEach(function(sem) {
            categories.forEach(function(block) {
                if (sem[block] != refNumbers[block])
                    booleans[block] = false;
            })
        });

        categories.forEach(function(block, i) {
            if (booleans[block])
                tab.push(categories[i]);
        })

        return tab;
    }

    function getCategFirstIdx(nodes, categorie) {
        var idx = -1;
        nodes.forEach(function(d, i) {
            if (d.categorie === categorie && idx === -1) {
                idx = i;
            }
        })
        return idx;
    }

    // recupere le sort index de la categorie avec le nom [name]
    function getSortIndexWithCategName(name) {
        var index = null;
        if (categories) {
            categories.forEach(function (d) {
               if(d.name === name && index === null) {
                   index = d.sortIndex;
               }
            });
        }
        return index;
    }

    function sortOptions(a,b) {
        var alpha = a.name.toLowerCase();
        var beta = b.name.toLowerCase();

        var aIdx = getSortIndexWithCategName(a.categorie);
        var bIdx = getSortIndexWithCategName(b.categorie);

        if(aIdx !== bIdx) {
            return bIdx - aIdx;
        } else {
            return beta.localeCompare(alpha.toLowerCase());
        }
    }

    // Fonction de calcul des positions de depart et d'arrivee des liens sur chaque noeud
    function computeLinkDepths() {
        nodes.forEach(function(node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });

        var skillList;
        var ignoredSkills;

        nodes.forEach(function(node) {
            ignoredSkills = getIgnoredSkills(node);
            skillList = getSkillsOfUE(node);

            node.sourceLinks.forEach(function(link) {
                link.sy = node.dy / 2 - link.dy / 2;
            })
            node.targetLinks.forEach(function(link) {
                link.ty = node.dy / 2 - link.dy / 2;
            });
        })

        function ascendingSourceDepth(a, b) {
            return a.source.y - b.source.y;
        }

        function ascendingTargetDepth(a, b) {
            return a.target.y - b.target.y;
        }
    }

    return sankey;
};
