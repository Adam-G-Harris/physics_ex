/* eslint-disable */

window.onload = () => {

    const particles = [],
        min_size = 3,
        max_size = 12,
        number_of_particles = 60,
        max_speed = max_size + 5,
        friction = .01,
        gravity = .5;

	const canvas = document.getElementById('canvas'),
		ctx = canvas.getContext('2d');

	canvas.width = window.innerWidth - 6;
	canvas.height = window.innerHeight - 6;

	function Particle(x, y, r, angle, speed, velocity_x, velocity_y, radians, next_x, next_y, mass) {
		this.x = x;
		this.y = y;
		this.r = r;
        this.angle = angle;
        this.speed = speed;
        this.next_x = next_x;
        this.next_y = next_y;
        this.velocity_x = velocity_x;
        this.velocity_y = velocity_y;
        this.radians = radians;
        this.mass = mass;
	}

	function init_particles() {
		for (let i = 0; i < number_of_particles; i++) {
            particles.push(validate_particle_position());
		}
	}

    function validate_particle_position() {
        const r = Math.floor(Math.random() * max_size) + min_size;
        const x = r * 3 + (Math.floor(Math.random() * canvas.width) - r * 3);
        const y = r * 3 + (Math.floor(Math.random() * canvas.height) - r * 3);
        const a = Math.floor(Math.random() * 360);

        const radians = a * Math.PI / 180;
        const s = max_speed - r;
        const m = r * 8; // *** Temp mass :: TBD *** //

        const velocity_x = Math.cos(radians) * s;
        const velocity_y = Math.sin(radians) * s;

        const particle = new Particle(x, y, r, a, s, velocity_x, velocity_y, radians, x, y, m);
        const placed_ok = overlapping_bounds(particle);

        return placed_ok ? particle : validate_particle_position();
    }

    function collide_particles(p1, p2) {
        const distance_x = p1.next_x - p2.next_x;
        const distance_y = p1.next_y - p2.next_y;

        /* Collision atan2 at collision */
        const collision_angle = Math.atan2(distance_x, distance_y);

        /* Velocity vector pre-collision */
        const speed_p1 = Math.sqrt(Math.pow(p1.velocity_x, 2) + Math.pow(p1.velocity_y, 2));
        const speed_p2 = Math.sqrt(Math.pow(p2.velocity_x, 2) + Math.pow(p2.velocity_y, 2));

        /* Radians given current velocity */
        const angle_p1 = Math.atan2(p1.velocity_y, p1.velocity_x);
        const angle_p2 = Math.atan2(p2.velocity_y, p2.velocity_x);

        /* Rotate vectors counterclockwise */
        const velocity_p1_x = speed_p1 * Math.cos(angle_p1 - collision_angle);
        const velocity_p1_y = speed_p1 * Math.sin(angle_p1 - collision_angle);
        const velocity_p2_x = speed_p2 * Math.cos(angle_p2 - collision_angle);
        const velocity_p2_y = speed_p2 * Math.sin(angle_p2 - collision_angle);

        /* Law of conservation of momentum */
        const conserved_velocity_p1_x = ((p1.mass - p2.mass) * velocity_p1_x + (p2.mass + p2.mass) * velocity_p2_x) / (p1.mass + p2.mass);
        const conserved_velocity_p2_x = ((p1.mass + p1.mass) * velocity_p1_x + (p2.mass - p1.mass) * velocity_p2_x) / (p1.mass + p2.mass);

        /* Y velocity statically conserved */
        const conserved_velocity_p1_y = velocity_p1_y;
        const conserved_velocity_p2_y = velocity_p2_y;

        /* Set & revert radians to preserve collision angle */
        p1.velocity_x = Math.cos(collision_angle) * conserved_velocity_p1_x + Math.cos(collision_angle + Math.PI/2) * conserved_velocity_p1_y;
        p1.velocity_y = Math.sin(collision_angle) * conserved_velocity_p1_x + Math.sin(collision_angle + Math.PI/2) * conserved_velocity_p1_y;
        p2.velocity_x = Math.cos(collision_angle) * conserved_velocity_p2_x + Math.cos(collision_angle + Math.PI/2) * conserved_velocity_p2_y;
        p2.velocity_y = Math.sin(collision_angle) * conserved_velocity_p2_x + Math.sin(collision_angle + Math.PI/2) * conserved_velocity_p2_y;

        /* Set & update next values for rendering || collisions */
        p1.next_x = (p1.next_x += p1.velocity_x);
        p1.next_y = (p1.next_y += p1.velocity_y);
        p2.next_x = (p2.next_x += p2.velocity_x);
        p2.next_y = (p2.next_y += p2.velocity_y);
    }

    function overlapping_bounds(particle) {
        let no_overlap = true;

        for (let i = 0; i < particles.length; i++) {
            if (inside_bounds(particle, particles[i])) {
                no_overlap = false;
            }
        }

        return no_overlap;
    }

    function inside_bounds(p1, p2) {
        let retval = false;
        const a = p1.next_x - p2.next_x;
        const b = p1.next_y - p2.next_y;
        const distance = (Math.pow(a, 2) + Math.pow(b, 2));

        if (distance <= (p1.r + p2.r) * (p1.r + p2.r)) {
            retval = true;
        }

        return retval;
    }

    function mass_particle_update() {
        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];

            /* Applying global friction */
            particle.velocity_x = particle.velocity_x - (particle.velocity_x * friction);
            particle.velocity_y = particle.velocity_y - (particle.velocity_y * friction);

            if (particle.y + particle.r <= canvas.height) {
                particle.velocity_y += gravity;
            } else {
                particle.velocity_x = 0;
                particle.velocity_y = 0;
                particle.y = canvas.height - particle.r;
            }

            particle.next_x = (particle.x += particle.velocity_x);
            particle.next_y = (particle.y += particle.velocity_y);
        }
    }

    function mass_test_wall_collisions() {
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];

            /* X Right */
            if (p.next_x + p.r > canvas.width) {
                p.velocity_x = p.velocity_x * -1;
                p.next_x = canvas.width - p.r;
            }
            /* X Left */
            else if (p.next_x - p.r < 0) {
                p.velocity_x = p.velocity_x * -1;
                p.next_x = p.r;
            }
            /* Y Up */
            else if (p.next_y + p.r > canvas.height) {
                p.velocity_y = p.velocity_y * -1;
                p.next_y = canvas.height - p.r;
            }
            /* Y Down */
            else if (p.next_y - p.r < 0) {
                p.velocity_y = p.velocity_y * -1;
                p.next_y = p.r;
            }
        }
    }

    function mass_test_particle_collisions() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {

                if (inside_bounds(particles[i], particles[j])) {
                    collide_particles(particles[i], particles[j]);
                }
            }
        }
    }

    function render_particles() {
        ctx.fillStyle = "#000000";

        for (var i = 0; i < particles.length; i++) {

            particles[i].x = particles[i].next_x;
            particles[i].y = particles[i].next_y;

            ctx.beginPath();
            ctx.arc(particles[i].x, particles[i].y, particles[i].r, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
    }

	function loop() {
        ctx.fillStyle = '#EEEEEE';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(1,  1, canvas.width -2, canvas.height -2);

        mass_particle_update();

        mass_test_wall_collisions();
        mass_test_particle_collisions();
        mass_test_wall_collisions();

        render_particles();

        requestAnimationFrame(loop);
	}

    init_particles();
    loop();
};
