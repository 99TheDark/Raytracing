const Sphere = class {
    static SIZE = 4; // 1 vec3 + 1 float

    constructor(x, y, z, radius) {
        [this.x, this.y, this.z, this.radius] = [x, y, z, radius];
    }
    toArray() {
        return [this.x, this.y, this.z, this.radius];
    }
}

const Point3 = class {
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
    }
    angle() {
        return new Point2(
            Math.atan(this.y / this.x),
            Math.acos(this.z / this.mag())
        );
    }
    copy() {
        return new Point3(
            this.x, 
            this.y,
            this.z
        );
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
};

const Point2 = class {
    constructor(x = 0, y = 0) {
        [this.x, this.y] = [x, y];
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        if(this.x == 0 && this.y == 0) return;

        let m = this.mag();
        this.x /= m;
        this.y /= m;
    }
    angle() {
        return Math.atan2(this.y, this.x);
    }
    fromAngle(ang) {
        this.x = Math.cos(ang);
        this.y = Math.sin(ang);
    }
    copy() {
        return new Point2(
            this.x,
            this.y
        );
    }
    toArray() {
        return [this.x, this.y]
    } 
}
