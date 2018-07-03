// Marges et taille du SVG
var margin = {
        top: 20,
        right: 300,
        bottom: 50,
        left: 20
    },
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

// Padding du SVG
var svgPadding = {
    top: 55,
    right: 35,
    bottom: 60,
    left: 15
};

// Création de la selection clic droit et du filtre de compétences (Appliquer,Programmation,etc...)
// exemple : currentFilters = ["Appliquer","Réaliser"] affiche les UE concernées par
// les compétences Appliquer et Realiser
// currentSelection comporte les noeuds sélectionnés au clic droit (0 à 2 noeuds)
var currentFilters = [];
var currentSelection = [];


// Echelle d3 de couleurs
var color = d3.scaleOrdinal(d3.schemeCategory10);

// NOTE: On pourrait mettre les couleurs directement dans le .json
// Il est aussi possible de remplacer SkillList simplement par sa longueur
// dans certains appels de fonctions
// NOTE : Il est possible de refactorer le code de certaines fonctions en créant
// une fonction de parcours des source/targetLinks et peut etre aussi
// en utilisant includes()

// Couleurs attribuées à chaque compétence
var skillColors = {
    "Realiser": color(0.16),
    "Appliquer": color(0.32),
    "Formaliser": color(0.50),
    "Construire": color(0.66),
    "Programmer": color(0.83),
    "Professionnaliser": color(1)
};

// Couleurs attribuées à chaque bloc
var groupColors = {
    "Mathématiques": "#b3ccff",
    "Informatique": "#ed7676",
    "Informatique théorique": "#bf79ea",
    "Ouverture": "lightgrey",
    "Langues": "#2aaf33"
};

// sélection d3 du g dans le svg
var svg = d3.select("body").append("svg")
    .attr("id", "chart")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .style("display", "inline-block")
    .attr("transform",
        "translate(" + svgPadding.left + "," + svgPadding.top + ")");

/*
var infoWindow = d3.select("body").append("div")
    .style("width", width + "px")
    .style("height", height + "px")
    .style("position", "absolute")
    .style("left", 8 + "px")
    .style("top", 8 + "px")
    .style("opacity", "0.9")
    .style("height", height + "px")
    .attr("id", "infoWindow")
    .style("background-color", "#333333");

var closeInfoWindow = infoWindow.append("div")
    .style("width", "50px")
    .style("height", "50px")
    .style("opacity", "0.7")
    .style("float", "right")
    .style("color", "white")
    .style("text-align", "center")
    .style("background-color", "black")
    .html("X")
    .on("click", function(d, i) {
        d3.select("#infoWindow").style("display", "none");
    });

var infoWindowText = infoWindow.append("p")
    .style("color", "white")
    .style("padding", "150px")
    .style("font-family", "Verdana")
    .style("text-align", "justify")
    .html("<u>Pré-requis</u><br/><br/> Programme de TS toutes spécialités confondues. <br/><br/><u>Contenu</u><br/><br/> Arithmétique dans Z. Division euclidienne. Diviseurs communs à deux entiers, pgcd, ppcm, lemme de Gauss. Théorème de Bézout. Algorithme dEuclide de calcul de pgcd. Nombres premiers. Existence et unicité de la décomposition en produit de facteurs premiers. Congruences : additions et multiplications. Systèmes de congruences, théorème chinois. Polynômes, somme, produit, fonctions polynômiales. Annulation en un point et factorisation par X -a.<br/><br/>Algèbre linéaire. Systèmes linéaires dans R^n, résolution par méthode du pivot. Matrices, produit de matrices, traduction des opérations de lignes et de colonnes. Calculs de noyaux et d'images. <br/><br/><u>Objectifs : savoir-faire et compétences</u><br/><br/> Résoudre de manière autonome des problèmes liés ou faisant appel à l'arithmétique élémentaire et à l'algèbre linéaire.")
*/

// Division à droite du svg représentant les compétences,blocs,boutons d'interaction
var filterDiv = d3.select("body").append("div")
    .attr("id", "filterDiv")
    .style("width", margin.right + "px");

// Création du layout d3 sankey
// Il va calculer la position de chaque noeud du graphe
// nodeWidth : largeur du noeud, nodePadding : espacement entre noeud, size : taille du sankey
var sankey = d3.sankey()
    .nodeWidth(100)
    .nodePadding(8)
    .size([width - svgPadding.right - svgPadding.left, height - svgPadding.bottom]);

// Paths svg pour les liens entre noeuds
var path = sankey.link();

// SVG représentant l'axe des semestres sous le graphe (Semestre 1,Semestre 2,etc...)
var semesterLayout = d3.select("body").append("svg")
    .attr("id", "semesterLayout")
    .attr("width", width)
    .attr("height", 45)
    .style("background-color", "#cce6ff")
    .append("g");

// création de la tooltip (infobulle)
var tip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Gestion du zoom sur la zone du SVG (zoom Max x3)
zoomHandler(svg, semesterLayout, 3);

// Parsing du json
d3.json("pedago.json").then(function(data) {

    // Création de l'objet graphe
    // On y insère les données parsées du json
    var graph = {
        "nodes": data,
        "links": getLinks(data)
    };

    // Désactiver le menu contextuel au clic droit lorsque la souris est sur le SVG
    d3.select("#chart").on("contextmenu", function() {
        d3.event.preventDefault();
    });

    // Initialisation des filtres (= toutes les compétences existantes ici)
    // currentFilters = getSkillList(graph.nodes);

    // Calcul de la dispoition des noeuds et liens du diagramme de sankey
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);

    //Mise en place de l'affichage des semestres sous le SVG du graphe
    displaySemesters(graph.nodes);

    // selection d3 des liens avec les données du sankey bindées
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

    // Initialisation de l'affichage des liens
    // displayLinks(link);

    // selection d3 des noeuds avec les données du sankey bindées
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("width", sankey.nodeWidth())
        .on("click", function() {
            // alert("click");
            /* d3.select("#infoWindow").style("display","block");*/
        }) // Gestion du drag des noeuds
        .call(d3.drag()
            .clickDistance(5)
            .on("drag", dragmove)
        );

    // selection d3 des rects du svg (= les rectangles de chaque noeud avec
    // couleur d'arrière plan )
    var nodeRects = node.append("rect")
        .attr("height", function(d) {
            return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .attr("rx", 2)
        .attr("ry", 2)
        .style("fill", applyColours("skillDisplay"))
        .classed("option", function(d) {
            return (d.option == "true");
        })
        .style("stroke", function(d) {
            console.log(d.color);
            return d3.rgb("#b3ccff").darker(2);
        });

    // Initialisation de l'affichage des liens
    displayNodes(nodeRects);


    // sélection d3 des textes au niveau des noeuds
    var nodeTexts = node.append("text")
        .attr("y", function(d) {
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("transform", "translate(" + (sankey.nodeWidth() / 2) + "," + 0 + ")")
        .style("text-anchor", "middle")
        .text(function(d) {
            return d.abreviation;
        })
        .style("font-size", adaptLabelFontSize)
        .filter(function(d) {
            return d.x < width / 2;
        });

    // gestion des évenements liés aux noeuds
    node
        .on("mouseover", function(d, i) {
            // Affichage de l'infobulle et mise à jour de ses informations
            tip.transition()
                .delay(500)
                .duration(200)
                .style("opacity", .8);
            var projetDescription = (d.projet == "true") ? "Cette UE comporte un projet" : "Cette UE ne comporte pas de projet";
            tip.html(d.name + "<br/>" +
                    printECTS(d.coefficient) + "<br/>" +
                    projetDescription)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 10) + "px");
        })
        .on("mouseout", function(d, i) {
            // Disparition de l'infobulle
            tip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on("contextmenu", function(d, i) {

            // sélection en mode compétence uniquement et lorsqu'une compétence est sélectionnée
            if (getDisplayMode() !== "skillDisplay" || document.getElementById("radiodef").checked) {
                return;
            }
            // Ajoute le noeud "d" cliqué s'il n'est pas deja dans currentSelection
            selectNode(d);

            // style noeuds sélectionnés
            node.filter(function(d, i) {
                return currentSelection.includes(d);
            }).selectAll("rect").style("stroke", "black").style("stroke-width", "4px");

            // style noeuds non sélectionnés
            node.filter(function(d, i) {
                return !currentSelection.includes(d);
            }).selectAll("rect").style("stroke", d3.rgb("#b3ccff").darker(2)).style("stroke-width", "2px");

            // Affichage par défaut quand rien n'est sélectionné
            if (currentSelection.length == 0)
                filterSkill(currentFilters);

            // Mise en valeur quand un seul noeud est sélectionné
            if (currentSelection.length == 1) {
                link.style("opacity", "0.2");
                node.style("opacity", "0.2");
                valoriseAdjacentLinks(currentSelection[0]).style("opacity", "1");
                valoriseAdjacentNodes(currentSelection[0], currentFilters).style("opacity", "1");
            }

        });

    var SkillList = getSkillList(graph.nodes);
    filterSkill(currentFilters);
    filterDisplayManager(SkillList, graph);
    setSkillDescription(SkillList);
    checkboxLabelColor(SkillList);

    // fonction gérant le drag
    function dragmove(d) {
        d3.select(this)
            .attr("transform",
                "translate(" +
                d.x + "," +
                (d.y = Math.max(-margin.top - svgPadding.top, Math.min(height - d.dy, d3.event.y))) + ")");
        sankey.relayout();
        link.attr("d", path);
    }

});


// ------ FONCTIONS ------ //


// RETURN : renvoie une chaine de caractere representant la taille de police
// adaptee de sorte que le label tienne dans la largeur du noeud
function adaptLabelFontSize() {

    var xPadding, labelAvailableWidth, labelWidth;
    xPadding = 8;
    labelAvailableWidth = sankey.nodeWidth() - xPadding;
    labelWidth = this.getComputedTextLength();

    if (labelWidth < labelAvailableWidth) {
        return null;
    }

    return (labelAvailableWidth / labelWidth) + "em";
}

// PARAM : un tableau de noeuds représentants les UEs [UEArray]
// et une compétence pour filtrer les UEs [skill]
// RETURN : renvoie un tableau comportant les UEs en lien avec la compétence
function getUEBySkill(UEArray, skill) {
    return UEArray.filter(function(d, i) {

        var skillArray = d.dependances,
            bool = false;

        skillArray.forEach(function(d, i) {
            if (d[0] === skill) {
                bool = true;
            }
        });

        return bool;
    });
}

// PARAM : un tableau de noeuds représentants les UEs [UEArray]
// RETURN : renvoie un tableau de liens de dépendances entre UEs
function getLinks(UEArray) {
    var links = [];

    UEArray.forEach(function(d, i) {
        d.dependances.forEach(function(din) {
            for (var j = 1; j < din.length; j++) {
                links.push({
                    "source": +d.ueid,
                    "linktype": din[0],
                    "target": +din[j],
                    "value": d.value
                });
            }
        });
    });

    return links;
}

// PARAM : un tableau de noeuds représentants les UEs [UEArray]
// et un entier représentant un id d'UE [UEId]
// RETURN : renvoie l'UE correspondant à l'id [UEId]
function getUEById(UEArray, UEId) {
    var UEs = UEArray.filter(function(d) {
        return +d.ueid === UEId;
    });

    if (UEs.length && UEs[0])
        return UEs[0];
}

// PARAM : tableau d'UEs [UEArray]
// RETURN : tableau [min,max] des valeurs de semestre (ex pour la licence : [1,6])
function getMinMaxSemester(UEArray) {
    return d3.extent(UEArray, function(d) {
        return +d.semestre;
    });
}

// PARAM : element considéré pour le zoom [tagToTransform1][tagToTransform2],
// multiplicateur max du zoom [maxZoom] et argument à indiquer si l'on souhaite réinitialiser l'échelle
function zoomHandler(tagToTransform1, tagToTransform2, maxZoom, reset) {

    d3.select("#chart")
        .call(d3.zoom()
            .scaleExtent([1 / 2, maxZoom])
            .translateExtent([
                [-width, -height],
                [2 * width + margin.right, 2 * height + margin.bottom]
            ])
            .on("zoom", zoomingDoc)
        );

    var transform = d3.zoomTransform(d3.select("#chart").node());
    transform.x = svgPadding.left;
    transform.y = svgPadding.top;

    if (reset) {
        transform.k = 1;
        tagToTransform2.attr("transform", "scale(1)");
    }

    function zoomingDoc() {
        tagToTransform1.attr("transform", d3.event.transform);
        tagToTransform2.attr("transform", "translate(" + (d3.event.transform.x - svgPadding.left) + ", 0) scale(" + d3.event.transform.k + ")");
    }
}

// PARAM : selection d3 de liens [links] entre UEs
// RETURN : void, affiche les liens avec une couleur différente selon la
// compétence mise en jeu
function displayLinks(links) {

    if (getDisplayMode() !== "skillDisplay") {
        return;
    }
    links.filter(function(d, i) {
        return d3.select(this).classed("ondisplaylinks");
    }).style("stroke", function(d) {
        return skillColors[d.linktype];
    });
}

// PARAM : selection d3 de liens [links] entre UEs
// RETURN : void, fait disparaitre les liens links à l'affichage
function hideLinks(links) {

    links.style("stroke", "none");
}

// PARAM : selection d3 de noeuds-UEs [nodes] à afficher
// RETURN : void, affiche les noeuds [nodes]
function displayNodes(nodes) {
    nodes.filter(function(d, i) {
        return d3.select(this).classed("ondisplaynodes");
    }).style("opacity", "1");
}

// PARAM : selection d3 de noeuds-UEs [nodes] à cacher
// RETURN : void, fait disparaitre les liens noeuds-UEs à l'affichage
function hideNodes(nodes) {

    nodes.style("opacity", "0.2");
}

// PARAM : filtres courants [skill]
// RETURN : tableau de filtres appliqués, gere l'affichage en fonction du filtrage
function filterSkill(skill) {

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");
    var displayedLinks = links.filter(function(d) {
        var containsFilter = skill.includes(d.linktype);
        if (containsFilter) {
            d3.select(this).classed("ondisplaylinks", true);
        } else {
            d3.select(this).classed("ondisplaylinks", false);
        }
        return containsFilter;
    });
    hideLinks(links);
    displayLinks(displayedLinks);

    var displayedNodes = nodes.filter(function(d) {
        var containsFilter = false;
        d.dependances.forEach(function(ddep, idep) {
            if (ddep[0] && skill.includes(ddep[0]))
                containsFilter = true;
        });
        if (containsFilter) {
            d3.select(this).classed("ondisplaynodes", true);
        } else {
            d3.select(this).classed("ondisplaynodes", false);
        }
        return containsFilter;
    });

    hideNodes(nodes);
    displayNodes(displayedNodes);
    applyColours(getDisplayMode());

    if (!currentFilters.length) {
        applyDefaultOpacity(links, nodes);
    }

    if (currentSelection.length == 1) {
        links.style("opacity", "0.2");
        nodes.style("opacity", "0.2");
        valoriseAdjacentLinks(currentSelection[0]).style("opacity", "1");
        valoriseAdjacentNodes(currentSelection[0], currentFilters).style("opacity", "1");
    }

    return skill;
}

// PARAM : selection d3 des liens [links] et du noeud [node] à mettre en valeur
// RETURN : selection d3 comportant tous les liens dont le noeud [node] est la
// source ou la destination
function valoriseAdjacentLinks(node) {
    var links = d3.selectAll(".link");

    return links.filter(function(d) {
        var containsFilter = false;
        var containsFilter2 = false;
        node.targetLinks.forEach(
            function(din) {
                if (d.target === din.target) {
                    containsFilter = true;
                }
            }
        );

        node.sourceLinks.forEach(
            function(din) {
                if (d.source === din.source) {
                    containsFilter2 = true;
                }
            }
        );
        return containsFilter || containsFilter2;
    });
}

// PARAM : selection d3 des liens [links], des noeuds [nodes]
// et du noeud [node] à mettre en valeur
// RETURN : void, gere l'affichage en fonction du filtrage
function valoriseAdjacentNodes(node, currentFilters) {
    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");


    return nodes.filter(function(dn) {
        var containsFilter = false;

        links.each(function(d) {
            if (((dn === d.source && d.target === node) ||
                    (dn === d.target && d.source === node) ||
                    (node === dn)) &&
                currentFilters.includes(d.linktype)) {
                containsFilter = true;
            }
        })

        return containsFilter;
    });

}

// PARAM : selection d3 des liens [links], des noeuds [nodes]
// RETURN : void, remet l'opacité des liens et des noeuds par défaut
function applyDefaultOpacity(nodes, links) {
    if (nodes)
        nodes.style("opacity", "1");
    if (links)
        links.style("opacity", "1");
}

// PARAM : selection d3 des liens des noeuds [nodes] et lien courant qui est
// onmouseover [link]
// RETURN : selection d3 des noeuds qui sont aux extrémités du lien [link]
function valoriseNodesOnLinkHover(link) {
    var nodes = d3.selectAll(".node");


    return nodes.filter(function(d) {
        return (link.datum().source === d || link.datum().target === d);
    });
}

//RETURN : Applique une couleur de fons aux noeuds
function applyColours(mode) {
    // return d.color = "#b3ccff";
    d3.selectAll(".node").each(function(d, i) {
        var ondisplay = d3.select(this).classed("ondisplaynodes");
        d3.select(this).select("rect").attr("fill", function() {
            if (mode == "groupDisplay") {
                return d.color = groupColors[d.categorie];
            } else if (mode == "skillDisplay") {
                return d.color = (ondisplay) ? skillColors[currentFilters[0]] : "#b3ccff";
            }
        });
    });
}

// PARAM : tableau d'UEs [UEArray]
// Met en place l'affichage des semestres sous le graphe
function displaySemesters(UEArray) {
    var tab = getMinMaxSemester(UEArray);

    var semesterScale = d3.scaleLinear()
        .domain(getMinMaxSemester(UEArray))
        .range([svgPadding.left + (sankey.nodeWidth() / 2), width - (sankey.nodeWidth() / 2) - (svgPadding.left / 2)]);

    for (var i = tab[0]; i <= tab[1]; i++) {
        d3.select("#semesterLayout g").append("text")
            .style("text-anchor", "middle")
            .style("fill", "steelblue")
            .attr("y", 15)
            .attr("x", semesterScale(i))
            .text("Semestre " + i)
            .style("font-family", "Verdana")
            .style("font-size", 14);
    }
}

// PARAM : tableau d'UEs [UEArray]
// RETURN : tableau d'intitulés de compétences concernées par les UEs [UEArray]
// EX : ["Appliquer","Programmer"]
function getSkillList(UEArray) {
    var SkillList = [];
    UEArray.forEach(function(d, i) {
        for (var j = 0; j < d.dependances.length; j++) {
            if (!SkillList.includes(d.dependances[j][0])) {
                SkillList.push(d.dependances[j][0]);
            }
        }
    });
    return SkillList;
}

// PARAM : tableau comportant toutes les compétences [SkillList], tableau des filtres actuellement
// appliqués [currentFilters]
// RETURN : void, gère les filtres en fonction des checkbox générées par
// cette fonction ainsi que les boutons d'interaction
// Doit être appelée une seule fois
function filterDisplayManager(SkillList, graph) {

    radioDisplaySetup();

    var skillDiv = filterDiv.append("div");
    skillDiv.append("h2")
        .text("Compétences");
    displaySkills(SkillList, skillDiv);

    var displayLegendDiv = filterDiv.append("div");
    displayLegendDiv.append("h2")
        .text("Blocs");
    displayBlocks(displayLegendDiv);

    // selectAllSetup(SkillList);

    buttonsSetup(graph);

    changeMode(graph, skillDiv, displayLegendDiv);
}

// RETURN : void, initialise l'affichage du bouton radio permettant de choisir le mode d'affichage
function radioDisplaySetup() {
    // titre
    filterDiv.append("h2").text("Affichage");

    //
    filterDiv.append("div")
        .attr("id", "displayRadio")
        .attr("width", "100%")
        .style("font-family", "Verdana")
        .append("label")
        .attr("for", "groupDisplay")
        .style("margin-left", "5px")
        .html("Blocs")
        .append("input")
        .attr("id", "groupDisplay")
        .attr("class", "radioInput")
        .attr("type", "radio")
        .attr("name", "displayMode")
        .attr("value", "groupDisplay")
        .attr("checked", "true");


    //
    filterDiv.select("#displayRadio")
        .append("label")
        .attr("for", "skillDisplay")
        .style("font-family", "Verdana")
        .html("Compétences")
        .append("input")
        .attr("id", "skillDisplay")
        .attr("class", "radioInput")
        .attr("type", "radio")
        .attr("name", "displayMode")
        .attr("value", "skillDisplay");
}

// PARAM : tableau comportant toutes les compétences [SkillList], tableau des filtres actuellement
// appliqués [currentFilters], selection d3 de l'element "div" du DOM contenant les checkbox de l'affichage par competences [skillDiv]
// RETURN : void, gere l'affichage en mode "competences" ainsi que la disposition des checkbox de ce mode d'affichage
function displaySkills(SkillList, skillDiv) {

    initDefaultRadio(skillDiv);

    for (var total = 0; total < SkillList.length; total++) {
        var checkDiv = skillDiv.append("div")
            .style("color", "white")
            .attr("id", "checkdiv" + total)
            .attr("class", "checkbox-area");
        checkDiv.append("input")
            .attr("type", "radio")
            .attr("name", "skillRadio")
            .attr("id", "radio" + total)
            .attr("value", SkillList[total]);
        checkDiv.append("label")
            .attr("for", "radio" + total)
            .append("p")
            .style("display", "inline")
            .style("font-family", "Verdana")
            .html(SkillList[total]);

        var currentRadio = document.getElementById("radio" + total);

        currentRadio.addEventListener("change", function() {
            var index = currentFilters.indexOf(this.value);
            currentFilters = [];
            if (this.checked) {
                if (index < 0) {
                    currentFilters.push(this.value);
                    // updateSelectAllCheckbox();
                }
            }
            filterSkill(currentFilters);
            if (currentSelection.length == 2) {
                displaySelection(getAllPathsBetween(currentSelection[0], currentSelection[1]));
            }
        });

    }
}

function initDefaultRadio(skillDiv) {
    var checkDivDef = skillDiv.append("div")
        .style("color", "white")
        .attr("id", "checkdivdef")
        .attr("class", "checkbox-area");
    checkDivDef.append("input")
        .attr("type", "radio")
        .attr("name", "skillRadio")
        .attr("checked", "true")
        .attr("id", "radiodef")
        .attr("value", "def");
    checkDivDef.append("label")
        .attr("for", "radiodef")
        .append("p")
        .style("display", "inline")
        .style("font-family", "Verdana")
        .html("Défaut");

    document.getElementById("radiodef").addEventListener("change", function() {
        var index = currentFilters.indexOf(this.value);
        currentFilters = [];
        resetSelection();
        filterSkill(currentFilters);
        if (currentSelection.length == 2) {
            displaySelection(getAllPathsBetween(currentSelection[0], currentSelection[1]));
        }
    });
}



// PARAM : selection d3 de l'element "div" du DOM contenant les checkbox de l'affichage par competences [displayLegendDiv]
// RETURN : void, gere l'affichage en mode "blocs" ainsi que la legende de ce mode d'affichage
function displayBlocks(displayLegendDiv) {
    for (var i = 0, sortedKeys = Object.keys(groupColors).sort(); i < Object.keys(groupColors).length; i++) {
        if (!groupColors.hasOwnProperty(sortedKeys[i])) {
            continue;
        }
        var displDiv = displayLegendDiv.append("div").append("p")
            .style("font-family", "Verdana")
            .style("margin", 0)
            .style("padding", "2px")
            .style("color", "white")
            .style("background", "linear-gradient(to right, " + groupColors[sortedKeys[i]] + ", #cce6ff)")
            .text(function(d) {
                return sortedKeys[i];
            });
    }
}

// PARAM : Tableau des donnees des noeuds et des liens [graph]
// RETURN : void, gere l'affichage du bouton de reinitialisation ainsi que la legende (UE en option)
function buttonsSetup(graph) {
    var svg = d3.select("#chart").select("g");
    var semesterLayout = d3.select("#semesterLayout").select("g");

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");

    var resetViewButton = filterDiv.append("button")
        .attr("class", "selectionButtons")
        .text("Réinitialiser la position");

    var optionLegend = filterDiv.append("div")
        .style("width", "100%");
    optionLegend.append("div")
        .attr("id", "optionImage");
    optionLegend.append("p").text("UE en option")
        .attr("id", "optionText");

    resetViewButton.on("click", function(d) {
        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);
        links.attr("d", path);
        nodes.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        svg.attr("transform",
            "translate(" + svgPadding.left + "," + svgPadding.top + ") scale(1)");
        zoomHandler(svg, semesterLayout, 3, "resetScale");
    });
}

// PARAM : Tableau des donnees des noeuds et des liens [graph], selection d3 de l'element "div" du DOM contenant les checkbox de l'affichage par competences [skillDiv],
// et selection d3 de l'element "div" du DOM contenant les checkbox de l'affichage par competences [displayLegendDiv]
// RETURN : void, gere les changements d'affichage du diagramme lors d'un changement de mode
function changeMode(graph, skillDiv, displayLegendDiv) {
    var links = d3.selectAll(".link");

    var radios = document.getElementsByName("displayMode");
    radios.forEach(function(button) {
        button.addEventListener("change", function() {
            switch (this.value) {
                case "skillDisplay":
                    filterSkill(currentFilters);
                    applyColours(this.value);
                    skillDiv.style("display", "block");
                    displayLegendDiv.style("display", "none");
                    displayLinks(links);
                    break;
                case "groupDisplay":
                    resetSelection();
                    filterSkill(getSkillList(graph.nodes));
                    applyColours(this.value);
                    skillDiv.style("display", "none");
                    displayLegendDiv.style("display", "block");
                    hideLinks(links);
                    break;

                default:
                    alert("erreur");
                    break;

            }
        });
        // initialise l'affichage
        if (button.checked) {
            button.dispatchEvent(new Event("change"));
        }
    })
}

// PARAM : tableau comportant toutes les compétences [SkillList]
// RETURN : void, initialise la checkbox "(De)Selectionner tout"
function selectAllSetup(SkillList) {
    var selectAllCheckbox = filterDiv.append("input")
        .attr("type", "checkbox")
        .attr("id", "selectallcheckbox")
        .attr("checked", "true");

    var selectAllLabel = filterDiv.append("label")
        .attr("for", "selectallcheckbox")
        .attr("id", "selectalllabel")
        .append("p")
        .style("display", "inline")
        .style("font-family", "Verdana")
        .html("(Dé)sélectionner tout");

    document.getElementById("selectallcheckbox").addEventListener("change", function() {
        if (this.checked) {
            for (var i = 0; i < SkillList.length; i++) {
                document.getElementById("checkbox" + i).checked = true;
                document.getElementById("checkbox" + i).dispatchEvent(new Event("change"));
            }
        } else {
            for (var i = 0; i < SkillList.length; i++) {
                document.getElementById("checkbox" + i).checked = false;
                document.getElementById("checkbox" + i).dispatchEvent(new Event("change"));
            }
        }
    });

    document.getElementById("selectalllabel").addEventListener("mousedown", function(e) {
        e.preventDefault();
    }, false);
}

// BRIEF : vide la selection de noeuds courante, et met à jour les styles en conséquence
function resetSelection() {
    var nodes = d3.selectAll(".node");
    var links = d3.selectAll(".link");
    currentSelection = [];
    nodes.selectAll("rect").style("stroke", d3.rgb("#b3ccff").darker(2)).style("stroke-width", "2px");
    applyDefaultOpacity(nodes, links);
}

// PARAM : tableau de compétences [SkillList]
// RETURN : void, gère l'affichage des descriptions de chaque compétence onmouseover
// dans la zone prévue à cet effet
function setSkillDescription(SkillList) {
    var descriptionDiv = filterDiv.append("div");
    var descriptionTitle = descriptionDiv.append("h2").text("Description");
    var descriptionContent = descriptionDiv.append("p")
        .attr("id", "description-area")
        .style("font-family", "Verdana")
        .style("font-size", "14px");

    var descriptions = {
        "Appliquer": "Ceci est la compétence appliquer",
        "Realiser": "Ceci est la compétence réaliser",
        "Programmer": "Ceci est la compétence programmer",
        "Professionnaliser": "Ceci est la compétence professionnaliser",
        "Formaliser": "Ceci est la compétence formaliser",
        "Construire": "Ceci est la compétence construire",
    };

    for (var total = 0; total < SkillList.length; total++) {
        document.getElementById("checkdiv" + total).addEventListener("mouseover", function() {
            document.getElementById("description-area").innerHTML = descriptions[this.firstChild.value];
        });
    }
}

// PARAM : tableau de compétences [SkillList]
// RETURN : void, applique la couleur de fond de chaque compétence au niveau des checkboxes
function checkboxLabelColor(SkillList) {
    for (var total = 0; total < SkillList.length; total++) {
        var checkdiv = document.getElementById("checkdiv" + total);
        var currentColor = skillColors[checkdiv.firstChild.value];
        checkdiv.style.backgroundColor = currentColor;
        checkdiv.style.background = "linear-gradient(to right, " + currentColor + ", #cce6ff)";
    }
}


// PARAM : Nombre d'ECTS d'une UE
// RETURN : void, applique la mise en forme ci-dessous pour affichage
function printECTS(ects) {
    return "ECTS : " + ects;
}

// PARAM : Noeud UE de départ [nodeA] et noeud UE d'arrivée [nodeB]
// RETURN : tableau de tableaux représentants les chemins menant de [nodeA] vers
// [nodeB]
function getAllPathsBetween(nodeA, nodeB) {
    var links = d3.selectAll(".link");

    var currentpath = [nodeA];
    var pathlist = [];
    getAllPathsBetweenRec(nodeA, nodeB, currentpath, pathlist, links);

    return pathlist;
}


// BRIEF : recursion de la fonction getAllPathsBetween
function getAllPathsBetweenRec(nodeA, nodeB, currentpath, pathlist, links) {

    if (nodeA.ueid === nodeB.ueid) {
        pathlist.push(currentpath.slice());
    }

    var adjacentNodes = getChildren(nodeA);
    for (var i = 0; i < adjacentNodes.length; i++) {
        if (hasActiveLinkBetweenNodes(nodeA, adjacentNodes[i], links.data())) {
            currentpath.push(adjacentNodes[i]);
            getAllPathsBetweenRec(adjacentNodes[i], nodeB, currentpath, pathlist, links);
            currentpath.pop();
        }
    }
}

// PARAM : Noeud UE concerné [node]
// RETURN : tableau des successeurs directs de [node]
function getChildren(node) {
    var children = [];
    node.sourceLinks.forEach(function(d, i) {
        if (children.indexOf(d.target) == -1) {
            children.push(d.target);
        }
    });
    return children;
}

// PARAM : [d]: Donnees rattachees au noeud a selectionner
// RETURN : void
// Ajoute le noeud considere a la liste des noeuds selectionnes (currentSelection) si la liste contient moins de deux elements
// ou retire le noeud de la liste si il etait deja dedans
function selectNode(d) {

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");

    var exist = currentSelection.indexOf(d);
    if (exist >= 0) {
        currentSelection.splice(exist, 1);
        applyDefaultOpacity(nodes, links);
        displayLinks(links);
        displayNodes(nodes);
        filterSkill(currentFilters);
    } else if (currentSelection.length < 2) {
        currentSelection.push(d);
        if (currentSelection.length == 2 && currentSelection[0].semestre != currentSelection[1].semestre) {
            currentSelection.sort(function(a, b) {
                return a.semestre - b.semestre;
            });
        } else if (currentSelection.length == 2 && currentSelection[0].semestre == currentSelection[1].semestre) {
            currentSelection[0].targetLinks.forEach(function(link) {
                if (link.source.ueid == currentSelection[1].ueid) {
                    var tmp = currentSelection[0];
                    currentSelection[0] = currentSelection[1];
                    currentSelection[1] = tmp;
                }
            })
        }
    }

    if (currentSelection.length == 2) {
        displaySelection(getAllPathsBetween(currentSelection[0], currentSelection[1]));
    }
}

// PARAM : [pathArray]: tableau de tableaux des chemins a afficher
// RETURN : void
// Cache les noeuds et liens ne faisant parti d'aucun chemin et change l'opacite des noeuds affiches
function displaySelection(pathArray) {

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");

    hideLinks(links);
    nodes.style("opacity", 0.2);

    if (!pathArray.length) {
        nodes.filter(function(d, i) {
            return (d.ueid === currentSelection[0].ueid || d.ueid === currentSelection[1].ueid);
        }).style("opacity", "1");
    }

    pathArray.forEach(function(path) {
        for (var k = 0; k < path.length; k++) {
            if (k != path.length - 1) {
                displayLinks(links.filter(function(d, i) {
                    return (d.source === path[k] && d.target === path[k + 1] && currentFilters.includes(d.linktype));
                }).style("opacity", "1"));
            }

            nodes.filter(function(d, i) {
                return (d.ueid === path[k].ueid && checkNodeDisplay(d, currentFilters));
            }).style("opacity", "1");
        }
    })
}
// PARAM : Noeud UE concerné [node]
// RETURN : tableau des compétences impliquées par l'UE [node]
function getSkillsOfUE(node) {
    var skills = [];
    if (node.dependances) {
        node.dependances.forEach(function(d, i) {
            skills.push(d[0]);
        });
    }
    return skills;
}

// PARAM : objet noeud [nodeA],[nodeB], et tableau de liens [links]
// RETURN : bool = true si les noeuds [nodeA] et [nodeB] ont un lien direct
// entre eux dans le filtrage courant de compétences ( = currentFilters)
// false sinon
function hasActiveLinkBetweenNodes(nodeA, nodeB, links) {
    var returnVal = false;
    links.forEach(function(d, i) {
        if (currentFilters.includes(d.linktype) && d.source == nodeA && d.target == nodeB) {
            returnVal = true;
        }
    })
    return returnVal;
}

// PARAM : [node]: Tableau des donnees rattachees au noeud [currentFilters]: tableau des filtres courants
// RETURN : Boolean => True si node fait travailler une des competences actuellement affichees, false sinon
function checkNodeDisplay(node, currentFilters) {
    var flag = false;

    for (var i = 0; i < node.dependances.length && flag == false; i++) {
        if (currentFilters.includes(node.dependances[i][0])) {
            flag = true;
        }
    }

    return flag;
}


// PARAM : [node]: Tableau des donnees rattachees au noeud
// RETURN : Tableau de toutes les compétences travaillées par l'UE mais sans lien (dans le JSON, compétence représentée sous la forme ["Appliquer"])
function getIgnoredSkills(node) {
    var ignoredSkills = [];
    node.dependances.forEach(function(skill) {
        if (skill.length == 1)
            ignoredSkills.push(skill[0]);
    });

    return ignoredSkills;
}

// RETURN : renvoie le mode d'affichage courant
function getDisplayMode() {
    var modes = document.getElementsByName("displayMode");
    for (i in modes) {
        if (modes[i].checked) {
            return modes[i].value;
        }
    }
}

// PARAM : un tableau de donnees représentants les UEs [UEArray], numero de semestre [sem]
// RETURN : les UE de UEArray pour lesquelles "option" vaut "true" et appartenant au semestre "sem"
function getOptionsBySemester(UEArray, sem) {
    return UEArray.filter(function(d) {
        return +d.semestre === sem && d.option === "true";
    });
}

// PARAM : tableau de donnes d'UE [options]
// RETURN : nom des UE (peut se combiner avev getOptionsBySemester)
function getUENameList(options) {
    return options.map(function(d) {
        return d.name;
    });
}
