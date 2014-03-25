/*jslint sloppy:true, browser: true, devel: true, eqeq: true, vars: true, white: true*/
/*global game: true, debugPanel:true, me:true*/

/*------------------- 
a player entity
-------------------------------- */
game.PlayerEntity = me.ObjectEntity.extend({

    /* -----

    constructor

    ------ */

    init: function(x, y, settings) {
        // call the constructor
        settings = settings || {};
        settings.image = "gripe_run_right";
        settings.spritewidth = 64;
        this.parent(x, y, settings);
        this.collidable = false;
        this.height = 64;
        this.alwaysUpdate = true;

		// set the default horizontal & vertical speed (accel vector)
        this.setVelocity(3, 15);

        // adjust the bounding box
        this.updateColRect(8, 48, 8, 54);
    
        // set the display to follow our position on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

    },

    /* -----

    update the player pos

    ------ */
    update: function() {
        if (this.collisionBox.top > me.game.world.height) {
            // Player died, but we'll just make them jump!
            this.pos.y = me.game.world.height;
            this.vel.y = -2 * this.maxVel.y;
            game.data.score = 0;
        } else {
            game.data.score = game.data.score + 1;
        }

        if (me.input.isKeyPressed('jump')) {
			// make sure we are not already jumping or falling
            if (!this.jumping && !this.falling) {
				// set current vel to the maximum defined value
				// gravity will then do the rest
				this.vel.y = -this.maxVel.y * me.timer.tick;
				// set the jumping flag
				this.jumping = true;
                // play some audio 
                me.audio.play("jump");
			}

        }

        // check & update player movement
        var y0 = this.collisionBox.bottom;
        this.updateMovement();
        var y1 = this.collisionBox.bottom;

        // check for collision
        me.game.world.collide(this, true).forEach(function (collision) {
            if (collision.obj.type === 'platform') {
                var top = collision.obj.collisionBox.top;
                if (y0 <= top && y1 >= top) {
                    this.pos.y = this.pos.y - y1 + top;
                    this.vel.y = 0;
                    this.falling = false;
                }
            }
        }, this);
        
        // update object animation
        this.parent();
		
		// inform the engine we performed an update
        return true   ;
    },
    updateMovement: function() {
        this.computeVelocity(this.vel);
        this.pos.add(this.vel);
    },
    computeVelocity: function(vel) {
        if (this.gravity) {
            vel.y += this.gravity * me.timer.tick;
            this.falling = vel.y > 0;
            if (this.falling) {
                this.jumping = false;
            }
        }
        // cap falling velocity
        if (vel.y > this.maxVel.y) {
            vel.y = this.maxVel.y;
        }
    }
});


/*----------------
 a Coin entity
------------------------ */
game.CoinEntity = me.CollectableEntity.extend({
    // extending the init function is not mandatory
    // unless you need to add some extra initialization
    init: function(x, y, settings) {
        // define this here instead of tiled
        settings.image = "spinning_coin_gold";
        settings.spritewidth = 32;
        // call the parent constructor
        this.parent(x, y, settings);
    },

    // this function is called by the engine, when
    // an object is touched by something (here collected)
    onCollision: function() {
        // do something when collected

        // play a "coin collected" sound
        me.audio.play("cling");

        // give some score
        game.data.score += 250;        

        // make sure it cannot be collected "again"
        this.collidable = true;
        // remove it
        me.game.remove(this);
    }

});


/* --------------------------
an enemy Entity
------------------------ */
game.EnemyEntity = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        // define this here instead of tiled
        settings.image = "wheelie_right";
        settings.spritewidth = 64;

        // call the parent constructor
        this.parent(x, y, settings);

        this.startX = x;
        this.endX = x + settings.width - settings.spritewidth;
        // size of sprite

        // make him start from the right
        this.pos.x = x + settings.width - settings.spritewidth;
        this.walkLeft = true;

        // walking & jumping speed
        this.setVelocity(1, 6);

        // set collision rectangle
        this.updateColRect(4, 56, 8, 56);

        // make it collidable
        this.collidable = true;
        // make it a enemy object
        this.type = me.game.ENEMY_OBJECT;

    },

    // call by the engine when colliding with another object
    // obj parameter corresponds to the other object (typically the player) touching this one
    onCollision: function(res, obj) {

        // res.y >0 means touched by something on the bottom
        // which mean at top position for this one
        if (this.alive && (res.y > 0) && obj.falling) {
            this.renderable.flicker(45);
        }
    },

    // manage the enemy movement
    update: function() {
        // do nothing if not in viewport
        if (!this.inViewport) {
            return false;
        }
        if (this.alive) {
            if (this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
            } else if (!this.walkLeft && this.pos.x >= this.endX) {
                this.walkLeft = true;
            }
            // make it walk
			this.flipX(this.walkLeft);
			this.vel.x += (this.walkLeft) ? -this.accel.x * me.timer.tick : this.accel.x * me.timer.tick;
				
        } else {
            this.vel.x = 0;
        }
		
        // check and update movement
        this.updateMovement();
		
        // update animation if necessary
        if (this.vel.x!=0 || this.vel.y!=0) {
            // update object animation
            this.parent();
            return true;
        }
        return false;
    }
});

game.PlatformGenerator = me.Renderable.extend({
    init: function() {
        this.parent(new me.Vector2d(), me.game.viewport.width, me.game.viewport.height);
        this.alwaysUpdate = true;
        this.platformFrequency = 40;
        this.nextPlatformAt = 0;
        this.tick = 0;
        // Add a first platform
        var platform = me.entityPool.newInstanceOf('PlatformEntity', 0, 300, {width: this.width});
        me.game.world.addChild(platform);
    },
    update: function() {
        if (this.tick % this.platformFrequency === 0) {
            this.nextPlatformAt = this.platformFrequency;
            var platform = me.entityPool.newInstanceOf("PlatformEntity", this.width, 300 + Math.floor(Math.random() * 100), {});
            me.game.world.addChild(platform);
        }
        this.tick = this.tick + 1;
        return true;
    }
});

game.PlatformEntity = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings = settings || {};
        settings.width = settings.width || 150;
        settings.height = settings.height || 10;
        this.renderable = new game.RenderableRect(0, 0, settings.width, settings.height);
        this.parent(x, y, settings);
        this.collidable = true;
        this.type = 'platform';
        this.gravity = 0;
        this.vel.x = -5;
        this.alwaysUpdate = true;
    },
    onCollision: function(res, obj) {
    },
    update: function() {
        this.updateMovement();
        if (this.collisionBox.right < -150) {
            me.game.world.removeChild(this);
            me.entityPool.freeInstance(this);
        }
        return true;
    }
});

game.RenderableRect = me.Renderable.extend({
    init: function(x, y, w, h) {
        this.parent(new me.Vector2d(x, y), w, h);
        this.z = 2;
    },
    destroy: function () {
    },
    draw: function(context) {
        context.save();
        context.fillStyle = '#fff';
        context.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        context.restore();
    }
});

game.NullCollisionLayer = me.Renderable.extend({
    init: function(width, height) {
        this.parent(new me.Vector2d(0, 0), width, height);
        this.isCollisionMap = true;
    },
    reset: function() {
    },
    checkCollision: function(obj, pv) {
        var res = {
            x: 0,
            y: 0,
            xprop: {},
            yprop: {}
        };
        return res;
    }
});