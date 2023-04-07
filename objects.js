const Sphere = class {
    static SIZE = 4; // 1 vec3 + 1 float

    constructor(x, y, z, radius) {
        [this.x, this.y, this.z, this.radius] = [x, y, z, radius];
    }
    toArray() {
        return [this.x, this.y, this.z, this.radius];
    }
}