# version 300 es

precision highp float;

uniform vec2 size;
uniform float time;

in vec2 pos;
out vec4 color;

struct Sphere {
    vec3 pos;
    vec3 color;
    float radius;
};

struct Light {
    vec3 pos;
    vec3 color;
    float intensity;
};

struct Camera {
    vec3 pos;
    vec2 dir;
};

uniform Camera cam;

Sphere[5] spheres = Sphere[](
    Sphere(
        vec3(4.0, -1.0, 6.0),
        vec3(0.7, 0.0, 0.0),
        2.0
    ), Sphere(
        vec3(-4.0, -1.0, 6.0),
        vec3(0.0, 0.3, 0.0),
        2.0
    ), Sphere(
        vec3(0.0, 1.0, 9.0),
        vec3(0.0, 0.0, 0.5),
        3.0
    ), Sphere(
        vec3(0.0, -10.0, 5.0),
        vec3(1.0, 1.0, 0.6),
        7.0
    ), Sphere(
        vec3(5.0, 0.0, -10.0),
        vec3(0.7, 0.3, 0.6),
        4.0
    )
);

Light[1] lights = Light[](
    Light(
        vec3(1.0, 6.0, -1.0),
        vec3(0.7, 0.9, 1.0),
        0.1
    )
);

#define aspect normalize(size)
#define uv (pos + 1.0) / 2.0
#define ambiance 0.4

#define PI 3.1415926535897932

float hit(vec3 pos, vec3 dir, Sphere sphere) {
    vec3 len = pos - sphere.pos;

    // Note: dot of self = square of length
    float a = dot(dir, dir);
    float b = dot(dir, len) * 2.0;
    float c = dot(len, len) - sphere.radius * sphere.radius;

    float determ = b * b - 4.0 * c;

    // Distance away
    float t = -INFINITY;

    if(determ > 0.0) {
        float r = sqrt(determ);
        t = min((r - b) / 2.0, (r + b) / -2.0);
    } else if(determ == 0.0) t = b / -2.0;

    return t;
}

vec3 point(vec3 a, vec3 b) {
    return normalize(b - a);
}

void main() {
    vec3 rot = vec3(cos(cam.dir.x), sin(cam.dir.y), sin(cam.dir.x));

    vec2 PIx = pos * aspect;

    // https://gamedev.stackexchange.com/questions/139703/compute-up-and-right-from-a-direction
    vec3 right = cross(rot, vec3(0.0, 1.0, 0.0));
    vec3 up = cross(right, rot);

    // Orgin & Direction
    vec3 org = cam.pos;
    vec3 dir = normalize(right * PIx.x + up * PIx.y + rot);

    color = vec4(0.0, 0.0, 0.0, 1.0);

    float diffuse = 1.0;

    for(int j = 0; j < MAX_BOUNCE; j++) {
        float t = INFINITY;
        int index = -1;

        for(int i = 0; i < NUM_SPHERES; i++) {
            float d = hit(org, dir, spheres[i]);
            if(d < t && d > 0.0) {
                index = i;
                t = d;
            }
        }

        // Has to hit something
        if(index == -1) continue;

        Sphere sphere = spheres[index];

        float dist = distance(org, sphere.pos);

        vec3 surface = org + dir * (t - dist * EPSILON); // Scale epsilon up as you get farther due to precision
        vec3 normal = normalize(surface - sphere.pos);

        // Loop through each light
        bool blocked = false;

        for(int k = 0; k < NUM_SPHERES; k++) if(hit(surface, point(surface, lights[0].pos), spheres[k]) >= 0.0) {
            blocked = true;
            break;
        }

        if(blocked) {
            color += vec4(sphere.color * ambiance, 1.0);
            break;
        }

        vec3 lambert = normalize(lights[0].color) * max(0.0, dot(normal, lights[0].pos)) * lights[0].intensity;

        color += vec4(lambert + sphere.color, 1.0) * diffuse;

        // Just darken it temporarily before diffused lighting is added
        diffuse *= 0.5;

        org = surface;
        dir = normal;
    }
}
