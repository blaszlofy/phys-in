import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, polygon, V2, circle, curve, arrow1, square, text,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function calcE(M, e, detail) {
    let E = M;
    for (let i = 0; i < detail; i++) {
        let f = E - e * Math.sin(E) - M;
        let f_der = 1 - e * Math.cos(E);
        E = E - (f / f_der);
    }
    return E;
}

function ellipseParameters(planet, focal2, focal1) {
    let a = (planet.sub(focal1).length() + planet.sub(focal2).length()) / 2
    let center = focal1.add(focal2).scale(0.5)
    let c = focal1.sub(center).length()
    let b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2))
    let u_dir = focal1.sub(center);
    let u = u_dir.length() < 0.0001 ? planet.sub(center).normalize() : u_dir.normalize();
    let v = u.rotate(Math.PI / 2).normalize()
    return {a: a, b: b, c: c, center: center, u: u, v: v};
}

function ellipse(planet, focal2, focal1, detail, startE = 0, endE = Math.PI * 2) {
    let params = ellipseParameters(planet, focal2, focal1)
    let path = []
    for (let E = startE; E <= endE; E += (endE - startE) / detail) {
        path.push(params.center.add(params.u.scale(params.a * Math.cos(E))).add(params.v.scale(params.b * Math.sin(E))))
    }
    return polygon(path)
}

const planet_pos = V2(-3.3, 0)
const cannon_pos = V2(-6, 0)

//STATIC
let outline = rectangle(16, 9).strokewidth(0);

let v_leg1 = text("v꜀ - magnitude of velocity required").fontfamily("Math").fontsize(20).position(V2(6, 3.4))
let v_leg2 = text("for a perfectly circular orbit").fontfamily("Math").fontsize(20).position(V2(6, 3.1))
let vel_sq = square(0.2).fill("red").strokewidth(0).position(V2(5, -3.4))
let f_sq = square(0.2).fill("blue").strokewidth(0).position(V2(5, -3.7))
let vel = text("velocity").fontfamily("Math").fontsize(20).position(V2(5.7, -3.4))
let f = text("gravitational force").fontfamily("Math").fontsize(20).position(V2(6.3, -3.7))
let legend = diagram_combine(v_leg1, v_leg2, vel_sq, vel, f_sq, f)

let int = new Interactive(control, canvas);

let crashed
int.draw_function = (inp) => {
    let M = inp["M"]
    let m = inp["m"]
    let t = inp["t"]
    let G = inp["G"]
    let v = inp["v"]

    crashed = false

    const r0 = planet_pos.sub(cannon_pos).length()
    const a = (G * M * r0) / (2 * G * M - Math.pow(v, 2) * r0) //semi-major axis from energy conservation
    const v_crit = Math.sqrt(G * M / r0)
    const other_point = cannon_pos.add(planet_pos.sub(cannon_pos).normalize().scale(2 * a))//either apo or periapsis
    const center = other_point.add(cannon_pos).scale(0.5)
    const focal_pos = center.scale(2).sub(planet_pos)

    let ellipse_params = ellipseParameters(cannon_pos, focal_pos, planet_pos)
    let e = ellipse_params.c / ellipse_params.a

    let period = 2 * Math.PI * Math.sqrt(Math.pow(ellipse_params.a, 3) / (G * M))

    let initial_mean_anomaly = ((v < v_crit) ? Math.PI : 0)
    let mean_anomaly = 2 * Math.PI * ((t % period) / period) + initial_mean_anomaly;
    let E = calcE(mean_anomaly, e, 10)


    let R = Math.cbrt(M)
    let r = 0.05 * Math.cbrt(m)

    let orbit = ellipse(cannon_pos, focal_pos, planet_pos, 100).stroke("gray")

    if (planet_pos.sub(other_point).length() <= R + r) {
        let crash_E_positive = Math.acos((a - R) / (a * e))

        let crash_E = (2 * Math.PI) - crash_E_positive
        let crash_M = crash_E - e * Math.sin(crash_E) //finally newton's method isn't needed
        let crash_t = ((crash_M - initial_mean_anomaly) / (2 * Math.PI)) * period

        if (t > crash_t) {
            E = crash_E
            crashed = true
        }

        orbit = curve(ellipse(cannon_pos, focal_pos, planet_pos, 100, Math.PI, crash_E).path.points).stroke("gray")
    } else if (t > period && int.intervals["t"] !== undefined) {
        int.set("t", 0)
    }

    let planet = circle(R).strokewidth(0).fill("lightblue").position(planet_pos)

    let pos_on_orbit = ellipse_params.center.add(ellipse_params.u.scale(ellipse_params.a * Math.cos(E))).add(ellipse_params.v.scale(ellipse_params.b * Math.sin(E)))
    let ball = circle(r).position(pos_on_orbit).strokewidth(0).fill("blue")

    let force = square(0)
    let velocity = square(0)

    if (!crashed) {
        let dir_to_planet = planet_pos.sub(pos_on_orbit).normalize()
        let dist_to_planet = planet_pos.sub(pos_on_orbit).length()
        let force_factor = 0.02 * G * M * m / Math.pow(dist_to_planet, 2)
        force = arrow1(pos_on_orbit, dir_to_planet.scale(force_factor).add(pos_on_orbit), 0.1).stroke("blue").fill("blue").strokewidth(3)

        let v_mag = 0.3 *  Math.sqrt(G * M * ((2 / dist_to_planet) - (1 / ellipse_params.a)))
        let tangent_dir = ellipse_params.u.scale(-ellipse_params.a * Math.sin(E))
            .add(ellipse_params.v.scale(ellipse_params.b * Math.cos(E)))
            .normalize()
        velocity =  arrow1(pos_on_orbit, tangent_dir.scale(v_mag).add(pos_on_orbit), 0.1).fill("red").stroke("red").strokewidth(3)
    }

    let v_esc_val = text("v꜀ = " + v_crit.toFixed(2) + " ⋅ 10³ m/s").fontfamily("Math").fontsize(20).position(V2(6, 4))

    draw(outline, orbit, planet, force, velocity, ball, legend, v_esc_val)
}

int.slider("t", 0, 30, 0, 0.02, 30, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10⁴ s")
int.slider("v", 1, 4, 3.84, 0.01, 20, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10³ m/s")
int.slider("M", 5, 7, 5.97, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10²⁴ kg")
int.slider("m", 2, 5, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " ⋅ 10³ kg ")
int.slider("G", 6, 8, 6.67, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10⁻¹¹ m³/kg⋅s²")

int.draw()
int.draw()