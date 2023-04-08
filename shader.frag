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
    vec3 dir;
};

uniform Camera cam;

Sphere[4] spheres = Sphere[](
    Sphere(
        vec3(4.0, -1.0, 10.0),
        vec3(0.7, 0.0, 0.0),
        2.0
    ), Sphere(
        vec3(-2.0, -1.0, 6.0),
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
#define ambiance 0.2

float hit(vec3 pos, vec3 dir, Sphere sphere) {
    vec3 len = pos - sphere.pos;

    // Note: dot of self = square of length
    float a = dot(dir, dir);
    float b = dot(dir, len) * 2.0;
    float c = dot(len, len) - sphere.radius * sphere.radius;

    float determ = b * b - 4.0 * c;

    // Distance away
    float t = 0.0;

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
    // Orgin & Direction
    vec3 org = cam.pos;
    vec3 dir = normalize(vec3(pos * aspect, 1.0) + cam.dir);

    color = vec4(0.0, 0.0, 0.0, 1.0);

    float diffuse = 1.0;

    for(int j = 0; j < MAX_BOUNCE; j++) {
        for(int i = 0; i < NUM_SPHERES; i++) {
            Sphere sphere = spheres[i];

            float t = hit(org, dir, sphere);

            if(t <= 0.0) continue;

            vec3 surface = org + dir * t;
            vec3 normal = normalize(surface - sphere.pos);

            // Loop through each light
            bool blocked = false;

            // replace normal with dir from surface to light source
            for(int k = 0; k < NUM_SPHERES; k++) if(k != i) if(hit(surface, point(surface, lights[0].pos), spheres[k]) > 0.0) {
                blocked = true;
                break;
            }

            if(blocked) {
                color += vec4(sphere.color * ambiance, 1.0);
                break;
            }

            vec3 lambert = normalize(lights[0].color) * max(0.0, dot(normal, lights[0].pos)) * lights[0].intensity;

            color += vec4(lambert + sphere.color, 1.0) * diffuse;

            diffuse *= 0.6;

            org = surface;
            dir = normal;

            break;
        }
    }
}
