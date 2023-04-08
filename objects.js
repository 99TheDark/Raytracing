const Sphere = class {
    static SIZE = 4; // 1 vec3 + 1 float

    constructor(x, y, z, radius) {
        [this.x, this.y, this.z, this.radius] = [x, y, z, radius];
    }
    toArray() {
        return [this.x, this.y, this.z, this.radius];
    }
}

const Point = class {
    constructor(x = 0, y = 0, z = 0) {
        [this.x, this.y, this.z] = [x, y, z];
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalize() {
        if(this.x == 0 && this.y == 0 && this.z == 0) return;

        let m = this.mag();        
        this.x /= m;
        this.y /= m;
        this.z /= m;

        return this;
    }
    angle() {
        if(this.x == 0 && this.y == 0 && this.z == 0) return new Point(0, 0, 0);

        let m = this.mag();

        return new Point(
            Math.acos(this.x / m),
            Math.acos(this.y / m),
            Math.acos(this.z / m)
        );
    }
    copy() {
        return new Point(
            this.x, 
            this.y,
            this.z
        );
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
};
