Promise.all([
    fetch("shader.vert"),
    fetch("shader.frag")
])
    .then(files => Promise.all(
        files.map(file => file.text())
    ))
    .then(texts => main(texts[0], texts[1]))

const scene = [
    0, 0, 0, 0, 0
];

var main = (vertexSource, fragmentSource) => {
    const canvas = document.getElementById("canvas");
    const canvasStyle = getComputedStyle(canvas);
    const gl = canvas.getContext("webgl2", {antialias: true});
    const fps = document.getElementById("fps");

    fragmentSource = fragmentSource
        .replaceAll("NUM_SPHERES", scene.length)
        .replaceAll("MAX_BOUNCE", MAX_LIGHT_BOUNCES)
        .replaceAll("INFINITY", INFINITY)
        .replaceAll("EPSILON", EPSILON)
        .replaceAll("INFINITY", INFINITY)

    const [width, height] = [parseInt(canvasStyle.width) / RESOLUTION, parseInt(canvasStyle.height) / RESOLUTION];
    const large = Math.max(width, height);

    [canvas.width, canvas.height] = [width, height];

    if(!gl) {
        let err = "Your browser does not support WebGL.";

        fps.textContent = err;
        throw err;
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        throw "Error compiling vertex shader.\n\n" + gl.getShaderInfoLog(vertexShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        throw "Error compiling fragment shader.\n\n" + gl.getShaderInfoLog(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw "Error linking program.\n\n" + gl.getProgramInfoLog(program);

    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
        throw "Error validating program.\n\n" + gl.getProgramInfoLog(program);

    const fs = Float32Array.BYTES_PER_ELEMENT;

    const tris = new Float32Array([
        -1, 1,
        1, 1,
        -1, -1,
        1, -1,
        1, 1,
        -1, -1
    ]);

    const triBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tris, gl.STATIC_DRAW);

    const posAttribLocation = gl.getAttribLocation(program, "vertPos");
    gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * fs, 0);
    gl.enableVertexAttribArray(posAttribLocation);

    gl.useProgram(program);

    const sizeUniformLocation = gl.getUniformLocation(program, "size");
    gl.uniform2f(sizeUniformLocation, width, height);

    gl.viewport(0, 0, width, height);

    fps.textContent = "60fps";

    let keys = {};

    let cam = {
        pos: new Point3(7, 1, -4),
        dir: new Point2(2, -0.17),
        speed: 0.3
    };

    let last = performance.now();
    const draw = () => {
        let time = performance.now() / 1000;

        cam.dir.x %= TAU;
        cam.dir.y %= TAU;

        cam.dir.y = Math.max(Math.min(cam.dir.y, HALF), - HALF);

        if(keys.w) {
            cam.pos.x += Math.cos(cam.dir.x) * cam.speed;
            cam.pos.z += Math.sin(cam.dir.x) * cam.speed;
        }
        if(keys.s) {
            cam.pos.x -= Math.cos(cam.dir.x) * cam.speed;
            cam.pos.z -= Math.sin(cam.dir.x) * cam.speed;
        }
        if(keys.d) {
            cam.pos.x += Math.cos(cam.dir.x + HALF) * cam.speed;
            cam.pos.z += Math.sin(cam.dir.x + HALF) * cam.speed;
        }
        if(keys.a) {
            cam.pos.x -= Math.cos(cam.dir.x + HALF) * cam.speed;
            cam.pos.z -= Math.sin(cam.dir.x + HALF) * cam.speed;
        }

        const timeUniformLocation = gl.getUniformLocation(program, "time");
        gl.uniform1f(timeUniformLocation, time);

        const camPosUniformLocation = gl.getUniformLocation(program, "cam.pos");
        const camDirUniformLocation = gl.getUniformLocation(program, "cam.dir");
        gl.uniform3fv(camPosUniformLocation, cam.pos.toArray());
        gl.uniform2fv(camDirUniformLocation, cam.dir.toArray());

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        fps.textContent = `${Math.round(1000 / (performance.now() - last))}fps`;
        last = performance.now();

        requestAnimationFrame(draw);
    };

    document.addEventListener("keydown", e => {
        e.preventDefault();
        keys[e.key] = true;
    });

    document.addEventListener("keyup", e => {
        e.preventDefault();
        keys[e.key] = false;
    });

    document.addEventListener("mousemove", e => {
        cam.dir.x += e.movementX / large;
        cam.dir.y -= e.movementY / large;
    });

    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });

    requestAnimationFrame(draw);
};
