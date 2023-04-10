# version 300 es

precision highp float;

uniform vec2 size;
uniform float time;
uniform int frame;
uniform sampler2D sampler;
uniform bool moving;

in vec2 pos;
out vec4 color;

struct Material {
    vec3 color;
    float roughness;
};

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

Sphere[6] spheres = Sphere[](
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
        vec3(1.0, 0.75, 0.07),
        7.0
    ), Sphere(
        vec3(5.0, 0.0, -10.0),
        vec3(0.87, 0.24, 0.44),
        4.0
    ), Sphere(
        vec3(60.0, 4.0, 20.0),
        vec3(0.47, 0.3, 0.67),
        5.0
    )
);

Light[1] lights = Light[](
    Light(
        vec3(1.0, 10.0, -1.0),
        vec3(0.7, 0.9, 1.0),
        0.1
    )
);

#define aspect normalize(size)
#define uv (pos + 1.0) / 2.0
#define ambiance 0.2
#define sky vec3(0.52, 0.76, 0.86)

#define infinity 4294967295.0

// Modified from https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float random(vec2 k) {
    return fract(sin(dot(k * time + pos, vec2(12.9898, 78.233))) * 43758.5453);
}

float hit(vec3 pos, vec3 dir, Sphere sphere) {
    vec3 len = pos - sphere.pos;

    // Note: dot of self = square of length
    float a = dot(dir, dir);
    float b = dot(dir, len) * 2.0;
    float c = dot(len, len) - sphere.radius * sphere.radius;

    float determ = b * b - 4.0 * c;

    // Distance away
    float t = -infinity;

    if(determ > 0.0) {
        float r = sqrt(determ);
        t = min((r - b) / 2.0, (r + b) / -2.0);
    } else if(determ == 0.0) t = b / -2.0;

    return t;
}

vec3 diffuse(vec3 normal, float strength) {
    if(strength == 0.0) return normal;

    vec2 ang = vec2(
        atan(normal.z, length(normal.xy)),
        atan(normal.y, normal.x) // likely the problem
    );

    ang.x += exp(random(normal.xy) * PI - HALF) * strength;
    ang.y += exp(random(normal.zy) * PI - HALF) * strength;

    return vec3(
        cos(ang.x) * cos(ang.y),
        sin(ang.y) * cos(ang.x),
        sin(ang.x)
    );
}

vec3 point(vec3 a, vec3 b) {
    return normalize(b - a);
}

void main() {
    vec3 rot = vec3(cos(cam.dir.x), sin(cam.dir.y), sin(cam.dir.x));

    vec2 pix = pos * aspect;

    // https://gamedev.stackexchange.com/questions/139703/compute-up-and-right-from-a-direction
    vec3 right = cross(rot, vec3(0.0, 1.0, 0.0));
    vec3 up = cross(right, rot);

    // Orgin & Direction
    vec3 org = cam.pos;
    vec3 dir = normalize(right * pix.x + up * pix.y + rot);

    color = vec4(0.0, 0.0, 0.0, 1.0);

    float darken = 1.0; // light energy
    bool hitAnything = false;

    for(int j = 0; j < MAX_BOUNCE; j++) {
        float t = infinity;
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

        hitAnything = true;

        Sphere sphere = spheres[index];

        float dist = distance(org, sphere.pos);

        vec3 surface = org + dir * (t - dist * EPSILON); // Scale epsilon up as you get farther due to precision
        vec3 normal = normalize(surface - sphere.pos);

        vec3 diffused = diffuse(normal, 0.1);

        for(int k = 0; k < NUM_LIGHTS; k++) {
            Light light = lights[k];

            vec3 lit = point(surface, light.pos);

            // Loop through each light
            bool blocked = false;

            for(int k = 0; k < NUM_SPHERES; k++) if(hit(surface, lit, spheres[k]) >= 0.0) {
                blocked = true;
                break;
            }

            if(!blocked) {
                vec3 lambert = max(0.0, dot(light.pos, normal)) * normalize(light.color) * light.intensity;

                color += vec4(lambert + sphere.color, 0.0) * darken;

                // Just darken reflections
                darken *= 0.9;
            }

            org = surface;
            dir = diffused;
        }
    }

    if(!hitAnything) color = vec4(sky, 1.0);

    float weight = float(frame) / float(frame + 1);
    float iweight = 1.0 - weight;

    // average
    if(frame != 0 && !moving) color = texture(sampler, uv) * weight + color * iweight;
}
