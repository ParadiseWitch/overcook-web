function dashSmocke(scene: Phaser.Scene, followSprite: Phaser.Physics.Arcade.Sprite, x: number, y: number) {
  const dashEmitter = scene.add.particles(x, y, 'particle_smoke');
  dashEmitter.setConfig({
    speed: 100,
    scale: { start: 0.5, end: 0 },
    blendMode: 'ADD',
    lifespan: 300
  });
  dashEmitter.startFollow(followSprite);
  dashEmitter.stop();
}