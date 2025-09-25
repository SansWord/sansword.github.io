faces = ["U", "D", "F", "B", "L", "R"];
types = ["E", "C"];
color_classes = ["up", "down", "left", "right", "front", "back"]

cube_position = {
  "centers": [
    "U",
    "F",
    "R",
    "B",
    "L",
    "D",
  ],
  "edges": [
    "UB",
    "UR",
    "UF",
    "UL",
    "FL",
    "FR",
    "BR",
    "BL",
    "DF",
    "DR",
    "DB",
    "DL",
  ],
  "corners": [
    "ULB",
    "UBR",
    "URF",
    "UFL",
    "DLF",
    "DFR",
    "DRB",
    "DBL"
  ]
}

cube_definition = {
  // 12 edges with 0,1 orientation
  "edges": [
    {
      "id": 0,
      "faces": ["up", "back"]
    },
    {
      "id": 1,
      "faces": ["up", "right"]
    },
    {
      "id": 2,
      "faces": ["up", "front"]
    },
    {
      "id": 3,
      "faces": ["up", "left"]
    },
    {
      "id": 4,
      "faces": ["front", "left"]
    },
    {
      "id": 5,
      "faces": ["front", "right"]
    },
    {
      "id": 6,
      "faces": ["back", "right"]
    },
    {
      "id": 7,
      "faces": ["back", "left"]
    },
    {
      "id": 8,
      "faces": ["down", "front"]
    },
    {
      "id": 9,
      "faces": ["down", "right"]
    },
    {
      "id": 10,
      "faces": ["down", "back"]
    },
    {
      "id": 11,
      "faces": ["down", "left"]
    }
  ],
  // 8 corners with 0,1,2 orientation
  "corners": [
    {
      "id": 0,
      "faces": ["up", "left", "back"]
    },
    {
      "id": 1,
      "faces": ["up", "back", "right"]
    },
    {
      "id": 2,
      "faces": ["up", "right", "front"]
    },
    {
      "id": 3,
      "faces": ["up", "front", "left"]
    },
    {
      "id": 4,
      "faces": ["down", "left", "front"]
    },
    {
      "id": 5,
      "faces": ["down", "front", "right"]
    },
    {
      "id": 6,
      "faces": ["down", "right", "back"]
    },
    {
      "id": 7,
      "faces": ["down", "back", "left"]
    }
  ],
  // 6 centers with 0,1,2,3 orientation
  "centers": [
    {
      "id": 0,
      "faces": ["up", "up", "up", "up"]
    },
    {
      "id": 1,
      "faces": ["front", "front", "front", "front"]
    },
    {
      "id": 2,
      "faces": ["right", "right", "right", "right"]
    },
    {
      "id": 3,
      "faces": ["back", "back", "back", "back"]
    },
    {
      "id": 4,
      "faces": ["left", "left", "left", "left"]
    },
    {
      "id": 5,
      "faces": ["down", "down", "down", "down"]
    }
  ]
}

cube = {
  // 12 edges with 0,1 orientation
  "edges": [
    {
      "id": 0,
      "orientation": 0
    },
    {
      "id": 1,
      "orientation": 0
    },
    {
      "id": 2,
      "orientation": 0
    },
    {
      "id": 3,
      "orientation": 0
    },
    {
      "id": 4,
      "orientation": 0
    },
    {
      "id": 5,
      "orientation": 0
    },
    {
      "id": 6,
      "orientation": 0
    },
    {
      "id": 7,
      "orientation": 0
    },
    {
      "id": 8,
      "orientation": 0
    },
    {
      "id": 9,
      "orientation": 0
    },
    {
      "id": 10,
      "orientation": 0
    },
    {
      "id": 11,
      "orientation": 0
    }
  ],
  // 8 corners with 0,1,2 orientation
  "corners": [
    {
      "id": 0,
      "orientation": 0
    },
    {
      "id": 1,
      "orientation": 0
    },
    {
      "id": 2,
      "orientation": 0
    },
    {
      "id": 3,
      "orientation": 0
    },
    {
      "id": 4,
      "orientation": 0
    },
    {
      "id": 5,
      "orientation": 0
    },
    {
      "id": 6,
      "orientation": 0
    },
    {
      "id": 7,
      "orientation": 0
    }
  ],
  // 6 centers with 0,1,2,3 orientation
  "centers": [
    {
      "id": 0,
      "orientation": 0
    },
    {
      "id": 1,
      "orientation": 0
    },
    {
      "id": 2,
      "orientation": 0
    },
    {
      "id": 3,
      "orientation": 0
    },
    {
      "id": 4,
      "orientation": 0
    },
    {
      "id": 5,
      "orientation": 0
    }
  ],
}

reset_cube = {
  // 12 edges with 0,1 orientation
  "edges": [
    {
      "id": 0,
      "orientation": 0
    },
    {
      "id": 1,
      "orientation": 0
    },
    {
      "id": 2,
      "orientation": 0
    },
    {
      "id": 3,
      "orientation": 0
    },
    {
      "id": 4,
      "orientation": 0
    },
    {
      "id": 5,
      "orientation": 0
    },
    {
      "id": 6,
      "orientation": 0
    },
    {
      "id": 7,
      "orientation": 0
    },
    {
      "id": 8,
      "orientation": 0
    },
    {
      "id": 9,
      "orientation": 0
    },
    {
      "id": 10,
      "orientation": 0
    },
    {
      "id": 11,
      "orientation": 0
    }
  ],
  // 8 corners with 0,1,2 orientation
  "corners": [
    {
      "id": 0,
      "orientation": 0
    },
    {
      "id": 1,
      "orientation": 0
    },
    {
      "id": 2,
      "orientation": 0
    },
    {
      "id": 3,
      "orientation": 0
    },
    {
      "id": 4,
      "orientation": 0
    },
    {
      "id": 5,
      "orientation": 0
    },
    {
      "id": 6,
      "orientation": 0
    },
    {
      "id": 7,
      "orientation": 0
    }
  ],
  // 6 centers with 0,1,2,3 orientation
  "centers": [
    {
      "id": 0,
      "orientation": 0
    },
    {
      "id": 1,
      "orientation": 0
    },
    {
      "id": 2,
      "orientation": 0
    },
    {
      "id": 3,
      "orientation": 0
    },
    {
      "id": 4,
      "orientation": 0
    },
    {
      "id": 5,
      "orientation": 0
    }
  ],
}

function testExistence() {
  for (var i = 0; i < faces.length; i++) {
    for (var j = 0; j < types.length; j++) {
      for (var k = 1; k <= 4; k++) {
        var id = faces[i] + "_" + types[j] + "_" + k;
        console.log(document.getElementById(id) == undefined)
      }
    }
  }

  for (var i = 0; i < faces.length; i++) {
    var id = faces[i] + "_Center";
    console.log(document.getElementById(id) == undefined)
  }
}

function clearColorClasses(elm) {
  for (var i = 0; i < color_classes.length; i++) {
    elm.classList.remove(color_classes[i]);
  }
}

function clearCube() {
  for (var i = 0; i < faces.length; i++) {
    for (var j = 0; j < types.length; j++) {
      for (var k = 1; k <= 4; k++) {
        var id = faces[i] + "_" + types[j] + "_" + k;
        clearColorClasses(document.getElementById(id))
      }
    }
  }

  for (var i = 0; i < faces.length; i++) {
    var id = faces[i] + "_Center";
    clearColorClasses(document.getElementById(id))
  }
}

function renderCenters() {
  center_faces = ["U", "F", "R", "B", "L", "D"];
  centers = cube.centers;
  for (var i = centers.length - 1; i >= 0; i--) {
    getFace(center_faces[i],"Center").classList.add(cube_definition.centers[centers[i].id].faces[centers[i].orientation]);
  }
}

function renderEdges() {
  edges = cube.edges;

  edge_faces = [
    ["U", "B"],
    ["U", "R"],
    ["U", "F"],
    ["U", "L"],
    ["F", "L"],
    ["F", "R"],
    ["B", "R"],
    ["B", "L"],
    ["D", "F"],
    ["D", "R"],
    ["D", "B"],
    ["D", "L"],
  ]
  edge_nums = [
    [1,1],
    [2,1],
    [3,1],
    [4,1],

    [4,2],
    [2,4],
    [4,2],
    [2,4],

    [1,3],
    [2,3],
    [3,3],
    [4,3],
  ]
  for (var i = 0; i < edges.length; i++) {
    //console.log("--")
    for (var j = 0; j < 2; j ++) {
      //console.log(cube_definition.edges[edges[i].id].faces[(edges[i].orientation + j)%2])
      getFace(edge_faces[i][j], "E", edge_nums[i][j]).classList.add(cube_definition.edges[edges[i].id].faces[(edges[i].orientation + j)%2]);
    }
  }
}

function renderCorners() {
  corners = cube.corners;

  corner_faces = [
    ["U", "L", "B"],
    ["U", "B", "R"],
    ["U", "R", "F"],
    ["U", "F", "L"],

    ["D", "L", "F"],
    ["D", "F", "R"],
    ["D", "R", "B"],
    ["D", "B", "L"]
  ]
  corner_nums = [
    [1,1,2],
    [2,1,2],
    [3,1,2],
    [4,1,2],

    [1,3,4],
    [2,3,4],
    [3,3,4],
    [4,3,4]
  ]
  for (var i = 0; i < corners.length; i++) {
    //console.log("-- " + i)
    for (var j = 0; j < 3; j ++) {
      //console.log(cube_definition.corners[corners[i].id].faces[(corners[i].orientation + j)%3])
      var corner = getFace(corner_faces[i][j], "C", corner_nums[i][j]);
      //console.log(corner)
      corner.classList.add(cube_definition.corners[corners[i].id].faces[(corners[i].orientation + j)%3]);
    }
  }


}

function renderCube() {
  clearCube();
  renderCenters();
  renderCorners();
  renderEdges();
}

function getFace(face, type, num) {
  if (type == "Center") {
    id = face + "_Center";
  } else {
    id = face + "_" + type + "_" + num;
  }

  //console.log("getting face:" + id);

  return document.getElementById(id);
}

renderCube()

function rotateLayer(layer, times /*1, 2, 3*/, wide) {
  for(var i = 0; i < times; i++) {
    rotateLayerOnce(layer);
    if (wide) {
      rotateMiddleLayerOnce(layer);
    }
  }
  clearCube();
  renderCube();
}

function rotateLayerOnce(layer) {
  //center_faces = ["U", "F", "R", "B", "L", "D"];
  rotateEdgeOnce(layer);
  rotateCornerOnce(layer);
  rotateCenterOnce(layer);
}

function rotateEdgeOnce(layer) {
  var flip = false;
  switch (layer) {
    case "U": // 0,1,2,3, done
      var movingIds = [0,1,2,3];
      break;
    case "L": // 3,4,11,7, done
      var movingIds = [3,4,11,7];
      break;
    case "F": // 2,5,8,4, done
      var movingIds = [2,5,8,4];
      var flip = true;
      break;
    case "R": //1,6,9,5, done
      var movingIds = [1,6,9,5];
      break;
    case "B": //
      var movingIds = [0,7,10,6];
      var flip = true;
      break;
    case "D": // 8,9,10,11, done
      var movingIds = [8,9,10,11];
      break;
  }
  var movingEdges = [
    cube.edges[movingIds[0]],
    cube.edges[movingIds[1]],
    cube.edges[movingIds[2]],
    cube.edges[movingIds[3]],
  ];
  cube.edges[movingIds[0]] = movingEdges[3];
  cube.edges[movingIds[1]] = movingEdges[0];
  cube.edges[movingIds[2]] = movingEdges[1];
  cube.edges[movingIds[3]] = movingEdges[2];
  if (flip) {
    flipEdges(layer);
  }
}

function flipEdges(layer) {
  switch (layer) {
    case "F": // 2,5,8,4
      flipEdge(cube.edges[2], 1);
      flipEdge(cube.edges[5], 1);
      flipEdge(cube.edges[8], 1);
      flipEdge(cube.edges[4], 1);
      break;
    case "B": // 0,7,10,6
      flipEdge(cube.edges[0], 1);
      flipEdge(cube.edges[7], 1);
      flipEdge(cube.edges[10], 1);
      flipEdge(cube.edges[6], 1);
      break;
  }
}

function rotateCornerOnce(layer) {
  var flip = false;
  switch (layer) {
    case "U": // 0,1,2,3, done
      var movingIds = [0,1,2,3];
      break;
    case "L": // 0,3,4,7
      var movingIds = [0,3,4,7];
      var flip = true;
      break;
    case "F": // 3,2,5,4, done
      var movingIds = [3,2,5,4];
      var flip = true;
      break;
    case "R": // 2,1,6,5, done
      var movingIds = [2,1,6,5];
      var flip = true;
      break;
    case "B": // 1,0,7,6
      var movingIds = [1,0,7,6];
      var flip = true;
      break;
    case "D": // 4,5,6,7, done
      var movingIds = [4,5,6,7];
      break;
  }
  var movingCorners = [
    cube.corners[movingIds[0]],
    cube.corners[movingIds[1]],
    cube.corners[movingIds[2]],
    cube.corners[movingIds[3]],
  ];
  cube.corners[movingIds[0]] = movingCorners[3];
  cube.corners[movingIds[1]] = movingCorners[0];
  cube.corners[movingIds[2]] = movingCorners[1];
  cube.corners[movingIds[3]] = movingCorners[2];
  if (flip) {
    //console.log("handle flipping");
    flipCorners(layer);
  }
}

function flipCorners(layer) {
  switch (layer) {
    case "R": // 2,1,6,5
      flipCorner(cube.corners[2], 1);
      flipCorner(cube.corners[1], 2);
      flipCorner(cube.corners[6], 1);
      flipCorner(cube.corners[5], 2);
      break;

    case "F": // 3,2,5,4
      flipCorner(cube.corners[3], 1);
      flipCorner(cube.corners[2], 2);
      flipCorner(cube.corners[5], 1);
      flipCorner(cube.corners[4], 2);
      break;

    case "L": // 0,3,4,7
      flipCorner(cube.corners[0], 1);
      flipCorner(cube.corners[3], 2);
      flipCorner(cube.corners[4], 1);
      flipCorner(cube.corners[7], 2);
      break;

    case "B": // 1,0,7,6
      flipCorner(cube.corners[1], 1);
      flipCorner(cube.corners[0], 2);
      flipCorner(cube.corners[7], 1);
      flipCorner(cube.corners[6], 2);
      break;

  }
}

function rotateCenterOnce(layer) {
  //center_faces = ["U", "F", "R", "B", "L", "D"];
  center_idxs = {
    "U": 0,
    "F": 1,
    "R": 2,
    "B": 3,
    "L": 4,
    "D": 5
  }
  var center_idx = center_idxs[layer];
  var center_orientation = cube.centers[center_idx].orientation
  //console.log("before:" + center_orientation);
  cube.centers[center_idx].orientation = (center_orientation + 1) % 4;
  //console.log("after:" + cube.centers[center_idx].orientation)
}

function rotateMiddleLayer(layer, times /*1, 2, 3*/) {
  for(var i = 0; i < times; i++) {
    rotateMiddleLayerOnce(layer);
  }
  clearCube();
  renderCube();
}

function rotateMiddleLayerOnce(layer) {
  //center_faces = ["U", "F", "R", "B", "L", "D"];
  var flip = false;
  switch (layer) {
    case "R": // R
      var movingCenterIds = [0,3,5,1];
      var movingEdgeIds = [2,0,10,8];
      break;
    case "L": // L
      var movingCenterIds = [0,1,5,3];
      var movingEdgeIds = [2,8,10,0];
      break;
    case "U": // U
      var movingCenterIds = [1,4,3,2];
      var movingEdgeIds = [5,4,7,6];
      break;
    case "D": // D
      var movingCenterIds = [1,2,3,4];
      var movingEdgeIds = [5,6,7,4];
      break;
    case "F": // F
      var movingCenterIds = [0,2,5,4];
      var movingEdgeIds = [3,1,9,11];
      break;
    case "B": // B
      var movingCenterIds = [0,4,5,2];
      var movingEdgeIds = [3,11,9,1];
      break;
  }
  var movingCenters = [
    cube.centers[movingCenterIds[0]],
    cube.centers[movingCenterIds[1]],
    cube.centers[movingCenterIds[2]],
    cube.centers[movingCenterIds[3]],
  ];
  cube.centers[movingCenterIds[0]] = movingCenters[3];
  cube.centers[movingCenterIds[1]] = movingCenters[0];
  cube.centers[movingCenterIds[2]] = movingCenters[1];
  cube.centers[movingCenterIds[3]] = movingCenters[2];

  var movingEdges = [
    cube.edges[movingEdgeIds[0]],
    cube.edges[movingEdgeIds[1]],
    cube.edges[movingEdgeIds[2]],
    cube.edges[movingEdgeIds[3]],
  ];
  cube.edges[movingEdgeIds[0]] = movingEdges[3];
  cube.edges[movingEdgeIds[1]] = movingEdges[0];
  cube.edges[movingEdgeIds[2]] = movingEdges[1];
  cube.edges[movingEdgeIds[3]] = movingEdges[2];

  for (let i = 0; i < 4; i++) {
    movingEdges[i].orientation = (movingEdges[i].orientation + 1) % 2;
  }

}

function rotateCube(layer, times /*1, 2, 3*/) {
  for(var i = 0; i < times; i++) {
    rotateCubeOnce(layer);
  }
  clearCube();
  renderCube();
}

function rotateCubeOnce(layer) {
  switch (layer) {
    case "U":
      rotateLayer("U", 1);
      rotateMiddleLayer("U", 1);
      rotateLayer("D", 3);
      break;
    case "L":
      rotateLayer("L", 1);
      rotateMiddleLayer("L", 1);
      rotateLayer("R", 3);
      break;
    case "F":
      rotateLayer("F", 1);
      rotateMiddleLayer("F", 1);
      rotateLayer("B", 3);
      break;
    case "R":
      rotateLayer("R", 1);
      rotateMiddleLayer("R", 1);
      rotateLayer("L", 3);
      break;
    case "B":
      rotateLayer("B", 1);
      rotateMiddleLayer("B", 1);
      rotateLayer("F", 3);
      break;
    case "D":
      rotateLayer("D", 1);
      rotateMiddleLayer("D", 1);
      rotateLayer("U", 3);
      break;
  }
}

function resetCube() {
  cube = JSON.parse(JSON.stringify(reset_cube));
  renderCube();
}

function submitScramble() {
  const reg = /(?:[LRUDFB]W?2?'?)/gm;

  var scramble = getScramblePattern();
  console.log("receving scrambe: " + scramble);
  resetCube();

  if (!scramble) {
    return
  }

  //const testScramble = "RL2FB2R'U2R'D'LB2U'F2D2B2R2U2R2UR";
  //scramble = testScramble;
  var operations = scramble.match(reg)
  for (var i = 0; i < operations.length; i++) {
    var operation = operations[i];
    handleScrambleOperation(operation);
  }

}

function handleScrambleOperation(operation) {
  // operation: [UDLRFB]w?[2']?
  if (operation.length == 1) {
    layer = operation
    var times = 1
    var wide = false;
  } else if (operation.length == 3){
    var times = operation[2] == "2" ? 2 : 3;
    layer = operation[0];
    var wide = true;
  } else {
    // [UDLRFB]w or [UDLRFB][2']?
    if (operation[1] == 'W') {
      times = 1;
      wide = true;
      layer = operation[0];
    } else {
      layer = operation[0];
      wide = false;
      var times = operation[1] == "2" ? 2 : 3;
    }
  }
  rotateLayer(layer, times, wide);
}

function submitSolution() {
  var solution = getSolution();
  console.log("receving solution: " + solution);

  if (!solution) {
    return
  }

  var edge_encoding = solution.split(",")[0];
  var corner_encoding = solution.split(",")[1];
  console.log("receving encodings: [" + edge_encoding + "], [" + corner_encoding + "]");
  resetCubeOrientation();
  handleEdgeEncoding(edge_encoding);
  handleCornerEncoding(corner_encoding);
  renderCube();
}

function resetCubeOrientation() {
  // 1. find D and reset to position
  let dPosition = -1;
  for (let i = 0; i < 6; i++) {
    if (cube.centers[i].id == 5) {
      dPosition = i;
    }
  }

  switch (dPosition) {
    case 0:
      rotateCube("R", 2);
      break;
    case 1:
      rotateCube("L", 1);
      break;
    case 2:
      rotateCube("F", 1);
      break;
    case 3:
      rotateCube("R", 1);
      break;
    case 4:
      rotateCube("B", 1);
      break;
  }
  // 2. find F and reset to position
  // 1. find D and reset to position
  let fPosition = -1;
  for (let i = 1; i < 5; i++) {
    if (cube.centers[i].id == 1) {
      dPosition = i;
    }
  }

  switch (dPosition) {
    case 2:
      rotateCube("U", 1);
      break;
    case 3:
      rotateCube("U", 2);
      break;
    case 4:
      rotateCube("U", 3);
      break;
  }
}

function handleEdgeEncoding(encoding) {
  if (!encoding) {
    return;
  }
  console.log("handle edge with encoding: " + encoding)
  //A-Y
  // moving buffer (UD) with target
  var targets = {
    // id, orientation
    "A": [ 0, 0],
    "B": [ 1, 0],
    "C": [ 2, 0],
    "D": [ 3, 0],

    "E": [ 2, 1],
    "F": [ 5, 0],
    "G": [ 8, 1],
    "H": [ 4, 0],

    "I": [ 3, 1],
    "J": [ 4, 1],
    "K": [11, 1],
    "L": [ 7, 1],

    "M": [ 0, 1],
    "N": [ 7, 0],
    "O": [10, 1],
    "P": [ 6, 0],

    "Q": [ 1, 1],
    "R": [ 6, 1],
    "S": [ 9, 1],
    "T": [ 5, 1],

    "U": [ 8, 0],
    "V": [ 9, 0],
    "W": [10, 0],
    "Y": [11, 0]
  }

  // swaping 8 and target with orientation
  var buffer = 8
  for (var i = 0; i < encoding.length; i++) {
    var target = targets[encoding.charAt(i)];

    if (i%2 == 1) {
      // odd mode, handle C/E, W,O
      switch(target) {
        case "C":
          target = "E"
          break;
        case "E":
          target = "C"
          break;
        case "W":
          target = "O"
          break;
        case "O":
          target = "W"
          break;
      }
    }

    var targetId = target[0];
    var orientation = target[1];
    var tmp = cube.edges[buffer];
    cube.edges[buffer] = cube.edges[targetId];
    cube.edges[targetId] = tmp;
    flipEdge(cube.edges[buffer], orientation);
    flipEdge(cube.edges[targetId], orientation);
  }

}

function handleCornerEncoding(encoding) {
  if (!encoding) {
    return;
  }
  console.log("handle corner with encoding: " + encoding)
  //A-Y
  // moving buffer (UFR) with target
  var targets = {
    // id, orientation
    "A": [0, 0],
    "B": [1, 0],
    "C": [2, 0],
    "D": [3, 0],
    "E": [3, 1],
    "F": [2, 2],
    "G": [5, 1],
    "H": [4, 2],
    "I": [0, 1],
    "J": [3, 2],
    "K": [4, 1],
    "L": [7, 2],
    "M": [1, 1],
    "N": [0, 2],
    "O": [7, 1],
    "P": [6, 2],
    "Q": [2, 1],
    "R": [1, 2],
    "S": [6, 1],
    "T": [5, 2],
    "U": [4, 0],
    "V": [5, 0],
    "W": [6, 0],
    "Y": [7, 0]
  }

  // swaping 2 and target with orientation

  for (var i = 0; i < encoding.length; i++) {
    //var buffer = i%2 == 0 ? 2 : 1;
    buffer = 2;
    var target = targets[encoding.charAt(i)];
    var targetId = target[0];
    var orientation = target[1];

    //swap targetId with buffer
    var tmp = cube.corners[buffer];
    cube.corners[buffer] = cube.corners[targetId];
    cube.corners[targetId] = tmp;

    flipCorner(cube.corners[buffer], orientation);
    flipCorner(cube.corners[targetId], -orientation);
  }

}

function randomCubeRotation(times) {
  for (let i = 0; i < times; i++) {
    randomCubeRotationOnce();
  }
}

function randomCubeRotationOnce() {
  const layers = ["U", "D", "L", "R", "F", "B"];
  layer = layers[Math.floor(Math.random() * 6)];
  times = Math.floor(Math.random() * 3)
  rotateCube(layer, times);
}

function flipEdge(edge, orientation) {
  edge.orientation = (edge.orientation + orientation) % 2;
}

function flipCorner(corner, orientation) {
  corner.orientation = (corner.orientation + orientation + 3) % 3;
}

function testResetCubeOrientation() {
  randomCubeRotation(3);
  var center = [];
  for (let i = 0; i < 6; i++) {
    center.push(cube.centers[i].id);
  }
  resetCubeOrientation();
  for (let i = 0; i < 6; i++) {
    if (cube.centers[i].id != i) {
      currentCenter = [];
      for (let j = 0; j < 6; j++) {
        currentCenter.push(cube.centers[j].id);
      }
      console.log("wrong position, case:" + center + ", result:" + currentCenter);
      break;
    }
  }
}

function getScramblePattern() {
  return document.getElementById("scramble").value.toUpperCase();
}

function getSolution() {
  return document.getElementById("solution").value.toUpperCase();
}

function addToHistory() {
  var patternHistory = getPatternHistory();
  var patternToAdd = getScramblePattern();
  var solutionToAdd = getSolution();
  for (let i = 0; i < patternHistory.length; i++) {
    if (patternHistory[i].pattern == patternToAdd
        && patternHistory[i].solution == solutionToAdd
      ) {
      return;
    }
  }
  patternHistory.push(
    {
      "time": new Date(),
      "pattern":getScramblePattern(),
      "solution":getSolution()
    }
  );
  localStorage.setItem("patternHistory", JSON.stringify(patternHistory))
}

function getPatternHistory() {
  var storedHistory = localStorage.getItem("patternHistory");
  if (!storedHistory) {
    return [];
  } else {
    try {
      return JSON.parse(storedHistory);
    } catch (error) {
      return [];
    }
  }
}

function clearHistory() {
  localStorage.setItem("patternHistory", "[]");
}

var three = new scrambow.Scrambow()

function generateScramble() {
  var s = three.get(1)[0].scramble_string.replace(/\s/g, "");
  document.getElementById("scramble").value = s;
  document.getElementById("solution").value = ""
  submitScramble();
}