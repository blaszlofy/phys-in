//Disclaimer: this simulation, unlike the almost all the other ones is mostly AI written and corrected, as implementing the molecular collisions would have been too long of a task otherwise

import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg,
    line, V2, xycorneraxes, text, xtickmark, square, plotv, circle
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");
let button = document.getElementById("restart")

let int = new Interactive(control, canvas);

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

//HTML CANVAS
const htmlcanvas = document.getElementById("htmlcanvas");
const ctx = htmlcanvas.getContext("2d");

function resizeCanvas() {
    htmlcanvas.width = htmlcanvas.clientWidth;
    htmlcanvas.height = htmlcanvas.clientHeight;
    redraw()
}
window.addEventListener('resize', resizeCanvas);

const world = {
    left: -8,
    right: 8,
    bottom: -4.5,
    top: 4.5
};

function worldToScreen(x, y) {
    return {
        x: (x - world.left) / (world.right - world.left) * htmlcanvas.width,
        y: (world.top - y) / (world.top - world.bottom) * htmlcanvas.height
    };
}

function drawCircle(worldX, worldY, radiusWorld, color) {
    let screenPos = worldToScreen(worldX, worldY);
    let pixelsPerWorldUnit = htmlcanvas.width / (world.right - world.left);
    let radiusPx = radiusWorld * pixelsPerWorldUnit;

    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radiusPx, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

const K_B = 1.380649e-23
const K_LATTICE = 700
const C_C_BOND_LENGTH_M = 1.42e-10
const C_C_BOND_LENGTH_WORLD = 0.15
const C_RADIUS_M = 73e-12
const O_RADIUS_M = 73e-12
const O_O_BOND_LENGTH_M = 121e-12
const O2_COLLISION_RADIUS_M = (O_O_BOND_LENGTH_M / 2) + O_RADIUS_M;

const WORLD_TO_METERS = C_C_BOND_LENGTH_M / C_C_BOND_LENGTH_WORLD

const C_RADIUS_WORLD = C_RADIUS_M / WORLD_TO_METERS
const O_RADIUS_WORLD = O_RADIUS_M / WORLD_TO_METERS
const O_O_BOND_WORLD = O_O_BOND_LENGTH_M / WORLD_TO_METERS
const O2_COLLISION_WORLD = O2_COLLISION_RADIUS_M / WORLD_TO_METERS
const C_O_BOND_LENGTH_M = 113e-12
const C_O_BOND_WORLD = C_O_BOND_LENGTH_M / WORLD_TO_METERS

const O2_MASS = 5.31e-26
const O_MASS = O2_MASS / 2
const C_MASS = 1.99e-26
const CO_MASS = C_MASS + O_MASS
const CO2_MASS = C_MASS + O_MASS * 2

const O2_MU = (O_MASS * O_MASS) / O2_MASS
const O2_I = O2_MU * Math.pow(O_O_BOND_WORLD, 2)
const CO_MU = (C_MASS * O_MASS) / CO_MASS
const CO_I = CO_MU * Math.pow(C_O_BOND_WORLD, 2)
const CO2_I = 2 * O_MASS * Math.pow(C_O_BOND_WORLD, 2)

const E_REL_DIRECT_CO2= 6.53e-19
const E_REL_CO_O= 8.90e-19
const E_REL_O_C= 1.11e-18
const SIM_E_A_DIRECT_CO2= 1.60e-19
const SIM_E_A_CO_RADICAL= 3.20e-19
const SIM_E_A_CO_O= 3.32e-20
const E_ENDO_O2_C = 2.37e-19
const E_REL_O2_C = SIM_E_A_CO_RADICAL - E_ENDO_O2_C

const DT = 1e-14

const A_FACTOR_DIRECT = 1e5
const A_FACTOR_RADICAL = 1e8
const A_FACTOR_RADICAL_O = 1e6

let carbonAtoms = []
let oxygenMolecules = []
let coMolecules = []
let co2Molecules = []
let freeOAtoms = []
let currentT = 600

let dataC = []
let dataO2 = []
let dataCO = []
let dataCO2 = []
let lastSampleTime = -1

function initGraphite() {
    carbonAtoms = []
    let numAtoms = int.get("C")

    let cols = Math.floor(Math.sqrt(numAtoms * 2))
    let rows = Math.ceil(numAtoms / cols)

    let startX = -(cols * C_C_BOND_LENGTH_WORLD) / 2
    let startY = -(rows * C_C_BOND_LENGTH_WORLD) / 2

    for (let i = 0; i < numAtoms; i++) {
        let col = i % cols
        let row = Math.floor(i / cols)
        carbonAtoms.push({
            x0: startX + col * C_C_BOND_LENGTH_WORLD + (row % 2 === 0 ? 0 : C_C_BOND_LENGTH_WORLD / 2),
            y0: startY + row * C_C_BOND_LENGTH_WORLD * 0.866,
            x: 0,
            y: 0
        })
    }
}

function initOxygen() {
    oxygenMolecules = []
    coMolecules = []
    co2Molecules = []
    freeOAtoms = []

    let numO2 = int.get("O₂")
    currentT = int.get("T")
    let v_rms = Math.sqrt((2 * K_B * currentT) / O2_MASS)
    let v_world = (v_rms * DT) / WORLD_TO_METERS

    for (let i = 0; i < numO2; i++) {
        let x = world.left + O2_COLLISION_WORLD + Math.random() * (world.right - world.left - 2 * O2_COLLISION_WORLD)
        let y = world.bottom + O2_COLLISION_WORLD + Math.random() * (world.top - world.bottom - 2 * O2_COLLISION_WORLD)
        if (Math.abs(x) < 2 && Math.abs(y) < 2) x += (x > 0 ? 2 : -2)

        let angle = Math.random() * 2 * Math.PI
        oxygenMolecules.push({
            type: 'O2', x: x, y: y, vx: v_world * Math.cos(angle), vy: v_world * Math.sin(angle),
            theta: Math.random() * Math.PI * 2, v_theta: (Math.random() - 0.5) * 0.1,
            mass: O2_MASS, inertia: O2_I, getAtoms: function() { return getO2Atoms(this); }
        })
    }
}


function getO2Atoms(m) {
    let dx = (O_O_BOND_WORLD / 2) * Math.cos(m.theta)
    let dy = (O_O_BOND_WORLD / 2) * Math.sin(m.theta)
    return [
        { type: 'O', x: m.x + dx, y: m.y + dy, rx: dx, ry: dy, radius: O_RADIUS_WORLD },
        { type: 'O', x: m.x - dx, y: m.y - dy, rx: -dx, ry: -dy, radius: O_RADIUS_WORLD }
    ]
}

function getCOAtoms(m) {
    let dC = C_O_BOND_WORLD * (O_MASS / CO_MASS)
    let dO = C_O_BOND_WORLD * (C_MASS / CO_MASS)
    let cx = m.x - dC * Math.cos(m.theta), cy = m.y - dC * Math.sin(m.theta)
    let ox = m.x + dO * Math.cos(m.theta), oy = m.y + dO * Math.sin(m.theta)
    return [
        { type: 'C', x: cx, y: cy, rx: cx - m.x, ry: cy - m.y, radius: C_RADIUS_WORLD },
        { type: 'O', x: ox, y: oy, rx: ox - m.x, ry: oy - m.y, radius: O_RADIUS_WORLD }
    ]
}

function getCO2Atoms(m) {
    let dx = C_O_BOND_WORLD * Math.cos(m.theta), dy = C_O_BOND_WORLD * Math.sin(m.theta)
    return [
        { type: 'C', x: m.x, y: m.y, rx: 0, ry: 0, radius: C_RADIUS_WORLD },
        { type: 'O', x: m.x + dx, y: m.y + dy, rx: dx, ry: dy, radius: O_RADIUS_WORLD },
        { type: 'O', x: m.x - dx, y: m.y - dy, rx: -dx, ry: -dy, radius: O_RADIUS_WORLD }
    ]
}

function getFreeOAtoms(m) {
    return [{ type: 'O', x: m.x, y: m.y, rx: 0, ry: 0, radius: O_RADIUS_WORLD }]
}

function applyWallBounce(m, atom, nx, ny, overlapX, overlapY, totalMass, inertia) {
    let vAx = m.vx - m.v_theta * atom.ry
    let vAy = m.vy + m.v_theta * atom.rx
    let vn = vAx * nx + vAy * ny

    if (vn < 0) {
        let rn = atom.rx * ny - atom.ry * nx
        let j = -2 * vn / (1 / totalMass + (rn * rn) / inertia)

        m.vx += (j * nx) / totalMass
        m.vy += (j * ny) / totalMass
        m.v_theta += (rn * j) / inertia
    }
    m.x += overlapX
    m.y += overlapY
}

function getArrheniusProb(Ea, T, A_factor) {
    return Math.min(1.0, A_factor * Math.exp(-Ea / (K_B * T)))
}

function getExplosionVelocities(joules, m1, m2) {
    let v1_ms = Math.sqrt((2 * joules * m2) / (m1 * (m1 + m2)))
    let v2_ms = Math.sqrt((2 * joules * m1) / (m2 * (m1 + m2)))
    return {
        v1: (v1_ms * DT) / WORLD_TO_METERS,
        v2: (v2_ms * DT) / WORLD_TO_METERS
    }
}

let t = 0
let lastRestart = 0
let num_opt = {
    xrange: [0, 30],
    yrange: [0, 300],
    yticks: [50, 150, 250],
    xticks: [],
    bbox: [V2(-7.5, -5.7), V2(5, -3.4)],
    headsize: 0.1
}

let hideTime = 0
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        hideTime = performance.now()
    } else if (hideTime > 0) {
        let hiddenDuration = (performance.now() - hideTime) / 1000
        lastRestart += hiddenDuration
    }
})

function animate(time) {
    requestAnimationFrame(animate)

    t = time / 1000 - lastRestart

    if (Math.floor(t) > lastSampleTime) {
        lastSampleTime = Math.floor(t)
        dataC.push(V2(t, carbonAtoms.length))
        dataO2.push(V2(t, oxygenMolecules.length))
        dataCO.push(V2(t, coMolecules.length))
        dataCO2.push(V2(t, co2Molecules.length))

        dataT.push(V2(t, currentT))

        if (dataC.length > 30) {
            dataC.shift()
            dataO2.shift()
            dataCO.shift()
            dataCO2.shift()

            dataT.shift()
        }
    }

    let allGases = [...oxygenMolecules, ...coMolecules, ...co2Molecules, ...freeOAtoms]

    let totalKE = 0
    let dof = 0
    let vScaleSq = Math.pow(WORLD_TO_METERS / DT, 2)

    for (let i = 0; i < allGases.length; i++) {
        let m = allGases[i]
        totalKE += 0.5 * m.mass * (m.vx * m.vx + m.vy * m.vy) * vScaleSq
        dof += 2
        if (m.inertia !== Infinity) {
            totalKE += 0.5 * m.inertia * m.v_theta * m.v_theta * vScaleSq
            dof += 1
        }
    }

    if (dof > 0) {
        currentT = (2 * totalKE) / (dof * K_B)
    }

    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height)

    for (let i = 0; i < allGases.length; i++) {
        let m1 = allGases[i]
        m1.x += m1.vx
        m1.y += m1.vy
        m1.theta += m1.v_theta
        let atoms1 = m1.getAtoms()

        atoms1.forEach(atom => {
            if (atom.x < world.left + atom.radius) applyWallBounce(m1, atom, 1, 0, (world.left + atom.radius) - atom.x, 0, m1.mass, m1.inertia)
            else if (atom.x > world.right - atom.radius) applyWallBounce(m1, atom, -1, 0, (world.right - atom.radius) - atom.x, 0, m1.mass, m1.inertia)
            if (atom.y < world.bottom + atom.radius) applyWallBounce(m1, atom, 0, 1, 0, (world.bottom + atom.radius) - atom.y, m1.mass, m1.inertia)
            else if (atom.y > world.top - atom.radius) applyWallBounce(m1, atom, 0, -1, 0, (world.top - atom.radius) - atom.y, m1.mass, m1.inertia)
        })
        atoms1 = m1.getAtoms()

        for (let j = i + 1; j < allGases.length; j++) {
            let m2 = allGases[j]
            let atoms2 = m2.getAtoms()

            for (let a1 of atoms1) {
                for (let a2 of atoms2) {
                    let dx = a2.x - a1.x, dy = a2.y - a1.y
                    let dist2 = dx * dx + dy * dy
                    let minDist = a1.radius + a2.radius

                    if (dist2 < minDist * minDist && dist2 > 0) {
                        let dist = Math.sqrt(dist2), nx = dx / dist, ny = dy / dist
                        let vA1x = m1.vx - m1.v_theta * a1.ry, vA1y = m1.vy + m1.v_theta * a1.rx
                        let vA2x = m2.vx - m2.v_theta * a2.ry, vA2y = m2.vy + m2.v_theta * a2.rx
                        let vn = (vA2x - vA1x) * nx + (vA2y - vA1y) * ny

                        if (vn < 0) {
                            let rn1 = a1.rx * ny - a1.ry * nx, rn2 = a2.rx * ny - a2.ry * nx
                            let k = (1 / m1.mass) + (1 / m2.mass) + (m1.inertia === Infinity ? 0 : (rn1 * rn1) / m1.inertia) + (m2.inertia === Infinity ? 0 : (rn2 * rn2) / m2.inertia)
                            let j_impulse = -2 * vn / k

                            m1.vx -= (j_impulse * nx) / m1.mass
                            m1.vy -= (j_impulse * ny) / m1.mass
                            if (m1.inertia !== Infinity) m1.v_theta -= (rn1 * j_impulse) / m1.inertia

                            m2.vx += (j_impulse * nx) / m2.mass
                            m2.vy += (j_impulse * ny) / m2.mass
                            if (m2.inertia !== Infinity) m2.v_theta += (rn2 * j_impulse) / m2.inertia
                        }
                        let overlap = minDist - dist
                        m1.x -= nx * overlap * 0.5
                        m1.y -= ny * overlap * 0.5
                        m2.x += nx * overlap * 0.5
                        m2.y += ny * overlap * 0.5
                    }
                }
            }
        }
    }

    let inertGases = [...coMolecules, ...co2Molecules]
    for (let i = 0; i < inertGases.length; i++) {
        let m = inertGases[i]
        let atoms = m.getAtoms()
        for (let a of atoms) {
            for (let c = 0; c < carbonAtoms.length; c++) {
                let cAtom = carbonAtoms[c]
                let dx = a.x - cAtom.x, dy = a.y - cAtom.y
                let dist2 = dx * dx + dy * dy
                let minDist = a.radius + C_RADIUS_WORLD

                if (dist2 < minDist * minDist) {
                    let dist = Math.sqrt(dist2), nx = dx / dist, ny = dy / dist
                    let vAx = m.vx - m.v_theta * a.ry, vAy = m.vy + m.v_theta * a.rx
                    let vn = vAx * nx + vAy * ny

                    if (vn < 0) {
                        let rn = a.rx * ny - a.ry * nx
                        let k = (1 / m.mass) + (m.inertia === Infinity ? 0 : (rn * rn) / m.inertia)
                        let j_impulse = -2 * vn / k
                        m.vx += (j_impulse * nx) / m.mass
                        m.vy += (j_impulse * ny) / m.mass
                        if (m.inertia !== Infinity) m.v_theta += (rn * j_impulse) / m.inertia
                    }
                    let overlap = minDist - dist
                    m.x += nx * overlap
                    m.y += ny * overlap
                }
            }
        }
    }

    let dr_rms_meters = Math.sqrt((K_B * currentT) / K_LATTICE)
    let max_r = (dr_rms_meters / WORLD_TO_METERS) * Math.SQRT2
    carbonAtoms.forEach(atom => {
        let angle = Math.random() * 2 * Math.PI, r = max_r * Math.sqrt(Math.random())
        atom.x = atom.x0 + r * Math.cos(angle)
        atom.y = atom.y0 + r * Math.sin(angle)
        drawCircle(atom.x, atom.y, C_RADIUS_WORLD, "#505159")
    })

    for (let i = oxygenMolecules.length - 1; i >= 0; i--) {
        let m1 = oxygenMolecules[i]
        let atoms1 = m1.getAtoms()
        let reacted = false

        for (let c = carbonAtoms.length - 1; c >= 0; c--) {
            let cAtom = carbonAtoms[c]
            for (let a = 0; a < 2; a++) {
                let oAtom = atoms1[a]
                let dx = oAtom.x - cAtom.x, dy = oAtom.y - cAtom.y
                let dist2 = dx * dx + dy * dy
                let minDist = O_RADIUS_WORLD + C_RADIUS_WORLD

                if (dist2 < minDist * minDist) {
                    let dist = Math.sqrt(dist2)
                    let rand = Math.random()

                    let probRadical = getArrheniusProb(SIM_E_A_CO_RADICAL, currentT, A_FACTOR_RADICAL)
                    let probDirect = getArrheniusProb(SIM_E_A_DIRECT_CO2, currentT, A_FACTOR_DIRECT)

                    if (rand < probRadical) {
                        reacted = true
                        let otherO = atoms1[1 - a]
                        let b_dx = otherO.x - oAtom.x, b_dy = otherO.y - oAtom.y
                        let b_dist = Math.sqrt(b_dx * b_dx + b_dy * b_dy)
                        let bnx = b_dx / b_dist, bny = b_dy / b_dist

                        let vels = getExplosionVelocities(E_REL_O2_C, CO_MASS, O_MASS)

                        let vcm_x = (m1.vx * O2_MASS) / (O2_MASS + C_MASS)
                        let vcm_y = (m1.vy * O2_MASS) / (O2_MASS + C_MASS)

                        coMolecules.push({
                            type: 'CO', x: oAtom.x, y: oAtom.y,
                            vx: vcm_x - bnx * vels.v1,
                            vy: vcm_y - bny * vels.v1,
                            theta: m1.theta, v_theta: m1.v_theta,
                            mass: CO_MASS, inertia: CO_I, getAtoms: function() { return getCOAtoms(this) }
                        })

                        freeOAtoms.push({
                            type: 'O', x: otherO.x, y: otherO.y,
                            vx: vcm_x + bnx * vels.v2,
                            vy: vcm_y + bny * vels.v2,
                            theta: 0, v_theta: 0,
                            mass: O_MASS, inertia: Infinity, getAtoms: function() { return getFreeOAtoms(this) }
                        })
                        carbonAtoms.splice(c, 1)
                        break

                    } else if (rand < probRadical + probDirect) {
                        reacted = true
                        let vcm_x = (m1.vx * O2_MASS) / CO2_MASS
                        let vcm_y = (m1.vy * O2_MASS) / CO2_MASS

                        let rot_w = Math.sqrt((2 * E_REL_DIRECT_CO2) / CO2_I) / (WORLD_TO_METERS / DT)
                        co2Molecules.push({
                            type: 'CO2', x: m1.x, y: m1.y,
                            vx: vcm_x,
                            vy: vcm_y,
                            theta: m1.theta, v_theta: m1.v_theta + (Math.random() < 0.5 ? 1 : -1) * rot_w,
                            mass: CO2_MASS, inertia: CO2_I, getAtoms: function() { return getCO2Atoms(this) }
                        })
                        carbonAtoms.splice(c, 1)
                        break

                    } else {
                        applyWallBounce(m1, oAtom, dx / dist, dy / dist, (dx / dist) * (minDist - dist), (dy / dist) * (minDist - dist), m1.mass, m1.inertia)
                    }
                }
            }
            if (reacted) break
        }
        if (reacted) { oxygenMolecules.splice(i, 1) }
        else {
            drawCircle(atoms1[0].x, atoms1[0].y, O_RADIUS_WORLD, "#ff3333")
            drawCircle(atoms1[1].x, atoms1[1].y, O_RADIUS_WORLD, "#ff3333")
        }
    }

    for (let i = freeOAtoms.length - 1; i >= 0; i--) {
        let atom = freeOAtoms[i]
        let reacted = false
        for (let c = carbonAtoms.length - 1; c >= 0; c--) {
            let cAtom = carbonAtoms[c]
            let dx = atom.x - cAtom.x, dy = atom.y - cAtom.y
            let dist2 = dx * dx + dy * dy
            let minDist = O_RADIUS_WORLD + C_RADIUS_WORLD

            if (dist2 < minDist * minDist) {
                let dist = Math.sqrt(dist2)
                if (Math.random() < getArrheniusProb(SIM_E_A_DIRECT_CO2, currentT, A_FACTOR_RADICAL_O)) {
                    reacted = true
                    let vcm_x = (atom.vx * O_MASS) / CO_MASS
                    let vcm_y = (atom.vy * O_MASS) / CO_MASS

                    let rot_w = Math.sqrt((2 * E_REL_O_C) / CO_I) / (WORLD_TO_METERS / DT)

                    coMolecules.push({
                        type: 'CO', x: cAtom.x, y: cAtom.y,
                        vx: vcm_x,
                        vy: vcm_y,
                        theta: Math.atan2(dy, dx),
                        v_theta: (Math.random() < 0.5 ? 1 : -1) * rot_w,
                        mass: CO_MASS, inertia: CO_I, getAtoms: function() { return getCOAtoms(this) }
                    })
                    carbonAtoms.splice(c, 1)
                    break
                } else {
                    let nx = dx / dist, ny = dy / dist
                    let vDotN = atom.vx * nx + atom.vy * ny
                    if (vDotN < 0) { atom.vx -= 2 * vDotN * nx; atom.vy -= 2 * vDotN * ny }
                    atom.x += nx * (minDist - dist)
                    atom.y += ny * (minDist - dist)
                }
            }
        }
        if (reacted) { freeOAtoms.splice(i, 1) }
        else { drawCircle(atom.x, atom.y, O_RADIUS_WORLD, "#ff3333") }
    }

    for (let i = coMolecules.length - 1; i >= 0; i--) {
        let m = coMolecules[i]
        let atoms = m.getAtoms()
        let cAtom = atoms[0]
        let reacted = false

        for (let j = freeOAtoms.length - 1; j >= 0; j--) {
            let oAtom = freeOAtoms[j]
            let dx = cAtom.x - oAtom.x, dy = cAtom.y - oAtom.y

            if (dx * dx + dy * dy <= Math.pow(C_RADIUS_WORLD + O_RADIUS_WORLD + 0.05, 2)) {
                let dist = Math.sqrt(dx * dx + dy * dy)
                let nx = dx / dist, ny = dy / dist
                let vn = (oAtom.vx - (m.vx - m.v_theta * cAtom.ry)) * nx + (oAtom.vy - (m.vy + m.v_theta * cAtom.rx)) * ny

                if (vn > 0 && Math.random() < getArrheniusProb(SIM_E_A_CO_O, currentT, A_FACTOR_RADICAL_O)) {
                    reacted = true
                    let vcm_x = ((m.vx * CO_MASS) + (oAtom.vx * O_MASS)) / CO2_MASS
                    let vcm_y = ((m.vy * CO_MASS) + (oAtom.vy * O_MASS)) / CO2_MASS

                    let rot_w = Math.sqrt((2 * E_REL_CO_O) / CO2_I) / (WORLD_TO_METERS / DT)

                    co2Molecules.push({
                        type: 'CO2', x: m.x, y: m.y,
                        vx: vcm_x,
                        vy: vcm_y,
                        theta: m.theta,
                        v_theta: m.v_theta + (Math.random() < 0.5 ? 1 : -1) * rot_w,
                        mass: CO2_MASS, inertia: CO2_I, getAtoms: function() { return getCO2Atoms(this) }
                    })
                    freeOAtoms.splice(j, 1)
                    break
                }
            }
        }
        if (reacted) { coMolecules.splice(i, 1) }
        else {
            drawCircle(atoms[1].x, atoms[1].y, O_RADIUS_WORLD, "#ff3333")
            drawCircle(atoms[0].x, atoms[0].y, C_RADIUS_WORLD, "#505159")
        }
    }

    co2Molecules.forEach(m => {
        let atoms = m.getAtoms()
        drawCircle(atoms[2].x, atoms[2].y, O_RADIUS_WORLD, "#ff3333")
        drawCircle(atoms[1].x, atoms[1].y, O_RADIUS_WORLD, "#ff3333")
        drawCircle(atoms[0].x, atoms[0].y, C_RADIUS_WORLD, "#505159")
    })

    int.draw()
}

let outline = rectangle(16, 12).strokewidth(0)

let div = line(V2(-8, -3.1), V2(8, -3.1))

let num_ax = xycorneraxes(num_opt).stroke("black").fill("black").textfill("black").fontsize(20).fontfamily("Math")
let N_label = text("N").fontfamily("Math").fontsize(20).position(V2(-7.8, -3.4))

let C_mol = circle(0.08).strokewidth(0).fill("#505159").position(V2(-1, -3.4))
let O_mol1 = circle(0.085).strokewidth(0).fill("#ff3333").position(V2(-0.93, -3.8))
let O_mol2 = circle(0.085).strokewidth(0).fill("#ff3333").position(V2(-1.07, -3.8))
let CO_mol1 = circle(0.085).strokewidth(0).fill("#ff3333").position(V2(-0.93, -4.2))
let CO_mol2 = circle(0.08).strokewidth(0).fill("#505159").position(V2(-1.07, -4.2))
let CO2_mol1 = circle(0.085).strokewidth(0).fill("#ff3333").position(V2(-0.86, -4.6))
let CO2_mol2 = circle(0.085).strokewidth(0).fill("#ff3333").position(V2(-1.14, -4.6))
let CO2_mol3 = circle(0.08).strokewidth(0).fill("#505159").position(V2(-1, -4.6))

let C_text = text("C").fontsize(20).fontfamily("Math").position(V2(-0.5, -3.4))
let O2_text = text("O₂").fontsize(20).fontfamily("Math").position(V2(-0.42, -3.8))
let CO_text = text("CO").fontsize(20).fontfamily("Math").position(V2(-0.4, -4.2))
let CO2_text = text("CO₂").fontsize(20).fontfamily("Math").position(V2(-0.35, -4.6))

let C_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("#505159").position(V2(0, -3.4))
let O2_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("#ff3333").position(V2(0, -3.8))
let CO_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("blue").position(V2(0, -4.2))
let CO2_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(2).stroke("cyan").position(V2(0, -4.6))

let leg = diagram_combine(C_mol, O_mol1, O_mol2, CO_mol1, CO_mol2, CO2_mol1, CO2_mol2, CO2_mol3, C_text, O2_text, CO_text, CO2_text, C_line, O2_line, CO_line, CO2_line).translate(V2(7, 0))

let t_lab1 = text("t (s)").fontsize(20).fontfamily("Math").position(V2(6.5, -5.7))

int.draw_function = (inp) => {
    let offset = Math.max(0, t - 30)

    let tick1 = xtickmark((t > 30) ? 30 - (t + 2) % 30 : 28, 0, "t", num_opt).fontfamily("Math").stroke("black").fontsize(20).textfill("black")
    let tick2 = xtickmark((t > 30) ? 30 - (t) % 30 : 30, 0, "t + 2", num_opt).fontfamily("Math").stroke("black").fontsize(20).textfill("black")

    let plotC = plotv(dataC.map(p => V2(p.x - offset, p.y)), num_opt).strokewidth(2).stroke("#505159")
    let plotO2 = plotv(dataO2.map(p => V2(p.x - offset, p.y)), num_opt).strokewidth(2).stroke("#ff3333")
    let plotCO = plotv(dataCO.map(p => V2(p.x - offset, p.y)), num_opt).strokewidth(2).stroke("blue")
    let plotCO2 = plotv(dataCO2.map(p => V2(p.x - offset, p.y)), num_opt).strokewidth(2).stroke("cyan")

    draw(outline, div, num_ax, N_label, tick1, tick2, plotC, plotO2, plotCO, plotCO2, leg, t_lab1)
}

int.slider("T", 300, 1800, 1500, 20, 10, (name, value) => name + " = " + value.toFixed(0) + " K")
int.slider("C", 100, 300, 200, 5, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("O₂", 200, 300, 200, 5, 10, (name, value) => name + " = " + value.toFixed(0))

int.draw()
int.draw()

function redraw() {
    int.draw()
}

button.addEventListener('click', () => {
    initGraphite()
    initOxygen()
    lastRestart = t
    t = 0

    dataC = []
    dataO2 = []
    dataCO = []
    dataCO2 = []
    lastSampleTime = -1
});

resizeCanvas()
initGraphite()
initOxygen()
requestAnimationFrame(animate)