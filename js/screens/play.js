/*jslint sloppy:true, browser: true, devel: true, eqeq: true, vars: true, white: true*/
/*global game: true, debugPanel:true, me:true*/

game.PlayScreen = me.ScreenObject.extend({
	/**
	 *  action to perform on state change
	 */
	onResetEvent: function() {
        // load a level
		// me.levelDirector.loadLevel("area01");
        
		// reset the score
		game.data.score = 0;

		// add our HUD to the game world
		this.HUD = new game.HUD.Container();
		me.game.world.addChild(this.HUD);
        
        var wasRunning = me.state.isRunning();
        if (wasRunning) {
            me.state.stop();
        }
        me.game.reset();
        if (wasRunning) {
            me.state.restart.defer();
        }
        me.game.collisionMap = new game.NullCollisionLayer(640, 480);

        var bkgImage = me.game.world.addChild(new me.ImageLayer(
            'background',
            640,
            480,
            'area01_bkg0',
            -1,
            1));
        var player = me.entityPool.newInstanceOf("mainPlayer", 150, 100, {});
        me.game.world.addChild(player);
        me.game.world.addChild(new game.PlatformGenerator());
        // play the audio track
        //me.audio.playTrack("DST-InertExponent");
	},


	/**
	 *  action to perform when leaving this screen (state change)
	 */
	onDestroyEvent: function() {
        // stop the current audio track
        //me.audio.stopTrack();
		// remove the HUD from the game world
		me.game.world.removeChild(this.HUD);
	}
});
