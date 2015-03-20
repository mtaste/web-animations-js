// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.


(function(shared, scope, testing) {

  scope.AnimationTimeline = function() {
    this._animations = [];
    this.currentTime = undefined;
  };

  scope.AnimationTimeline.prototype = {
    // FIXME: This needs to return the wrapped players in Web Animations Next
    // TODO: Does this need to be sorted?
    // TODO: Do we need to consider needsRetick?
    getAnimationPlayers: function() {
      this._discardPlayers();
      return this._animations.slice();
    },
    _discardPlayers: function() {
      this._animations = this._animations.filter(function(player) {
        return player.playState != 'finished' && player.playState != 'idle';
      });
    },
    play: function(source) {
      var player = new scope.Player(source);
      this._animations.push(player);
      scope.restartWebAnimationsNextTick();
      // Use player._player.play() here, NOT player.play().
      //
      // Timeline.play calls new scope.Player(source) which (indirectly) calls Timeline.play on
      // source's children, and Player.play is also recursive. We only need to call play on each
      // player in the tree once.
      player._player.play();
      return player;
    },
  };

  var ticking = false;

  scope.restartWebAnimationsNextTick = function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(webAnimationsNextTick);
    }
  };

  function webAnimationsNextTick(t) {
    var timeline = window.document.timeline;
    timeline.currentTime = t;
    timeline._discardPlayers();
    if (timeline._animations.length == 0)
      ticking = false;
    else
      requestAnimationFrame(webAnimationsNextTick);
  }

  var timeline = new scope.AnimationTimeline();
  scope.timeline = timeline;

  try {
    Object.defineProperty(window.document, 'timeline', {
      configurable: true,
      get: function() { return timeline; }
    });
  } catch (e) { }
  try {
    window.document.timeline = timeline;
  } catch (e) { }

})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
