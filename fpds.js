/*
   w - width of the background grid
   h - height of the background grid
   r - minimum radius from any other sample
   k - total number of attempts before rejection of sample
   done - callback to fire once there are no new points to generate
*/
class Fpds {
  constructor(cfg){
    
    this.w = cfg.w;
    this.h = cfg.h;
    
    // minimum radius from any other sample
    this.rad = cfg.r;
    
    // total number of attempts before rejection of sample
    this.k = cfg.k;
    
    // callback once there are no new points to generate
    this.done = cfg.done || function(){};
    
    // background grid to improve performance of searches
    this.grid = [];
    
    // size of each cell
    this.sz = this.rad / Math.sqrt(2);

    // collection of samples that are used as neighbours to get other samples in the domain
    this.active = [];
    
    this.started = false;
    
    this.dirtySamples = [];
    
    this.cols = floor(this.w / this.sz);
    this.rows = floor(this.h / this.sz);
    for(let i = 0; i < this.cols * this.rows; ++i){
      this.grid[i] = undefined;
    }
  }
  
  addActive(x, y){
    let c = floor(x / this.sz);
    let r = floor(y / this.sz);
    let v = createVector(x, y);
    
    this.grid[r * this.cols + c] = v;
    this.active.push(v);
    
    this.started = true;
    
    return v;
  }
  
  generate(iters){
        
    let newSamples = [];
        
    if(this.active.length === 0) {
      if(this.started){
        this.done();
      }
      return [];
    }
    
    for(let it = 0; it < iters; ++it){

      /*
        Step 2.
        While the active list is not empty,
        choose a random index from it (say i)
        Generate up to k points chosen uniformly from the spherical annulus between radius r and 2r around xi.
        For each point in turn, check if it is within distance r of existing samples (using the background grid to only test nearby samples).
        If a point is adequately far from existing samples, emit it as the next sample and add it to the active list.
        If after k attempts no such point is found, instead remove i from the active list.
      */

      // Pick one of the active points. We're going to try to find sample around it.
      let randIndex = floor(random(this.active.length));
      let currActive = this.active[randIndex];

      // If we iterate 30 times and it isn't an adequate distance
      // there's something wrong with the sample, so remove it.
      let valid = false;

      // Try to find neighbours
      for(let n = 0; n < this.k; n++){

        // we want to create a vector that isn't too close or too far away from the sample we're currently working with.
        let newSample = p5.Vector.random2D();
        newSample.setMag(random(this.rad, this.rad * 2));
        newSample.add(currActive);

        let col = floor(newSample.x / this.sz);
        let row = floor(newSample.y / this.sz);

        if(	col > -1 && row > -1 && 
            col < this.cols && row < this.rows &&
             !this.grid[col + row * this.cols] )
        {	
          let ok = true;
          
          for(let r = -1; r <= 1; r++){
            for(let c = -1; c <= 1; c++){
              let adjacentIdx = (row + r) * this.cols + (col + c);
              let neighbour = this.grid[adjacentIdx];

              // found a sample in an adjacent cell, now check if it's far enough away.
              if(neighbour){
                let d = p5.Vector.dist(newSample, neighbour);
                if(d < this.rad){
                  ok = false;
                }
              }
            }
          }

          if(ok){
            valid = true;
            this.active.push(newSample);
            this.grid[row * this.cols + col] = newSample;
            this.dirtySamples.push(newSample);
            newSamples.push(newSample);
          }
        }
      }

      if(valid === false){
        this.active.splice(randIndex,1);
      }	
    }
        
    return newSamples;
  }
  
  drawLastSamplesHelper(g){
    g.push();
    
    g.strokeWeight(2);
    g.stroke(255);
    g.noFill();
    g.beginShape(POINTS);
    this.dirtySamples.forEach(s => {
      g.vertex(s.x, s.y);
    });
    g.endShape();
    
    g.pop();
    
    this.dirtySamples = [];
  }
  
  // Try to avoid calling this since it's too slow
  drawAllSamplesHelper(g){
    g.push();
    
    g.strokeWeight(2);
    g.stroke(255);
    g.noFill();
    
    g.beginShape(POINTS);
    for(let i = 0; i < this.grid.length; i++){
      if(this.grid[i]){
        g.vertex(this.grid[i].x, this.grid[i].y);
      }
    }
    g.endShape();
    g.pop();
  }
  
  drawActiveHelper(){
    g.push();
    
    g.strokeWeight(2);
    g.stroke(255,0,0,10);
    g.noFill();
    
    g.beginShape(POINTS);
    this.active.forEach( a => g.vertex(a.x, a.y));
    g.endShape();
    
    g.pop();
  }
  
  /*
    Get a string representation of all the samples
  */
  toString(){
    let str = '[';
    
    for(let i = 0; i < this.grid.length; i++){
      if(this.grid[i]){
        let x = floor(this.grid[i].x);
        let y = floor(this.grid[i].y);
        str += `[${x},${y}]`
        if(i < this.grid.length-2){
          str += ',';
        }
      }
    }
    
    str += ']';
    
    return str;
  }
  
  drawGridHelper(g){
    g.push();
    
    g.stroke(100, 100);
    g.strokeWeight(0.8);

    let sz = this.sz;
    
    for(let x = 0; x <= this.cols; x++){
      g.line(x*sz, 0, x*sz, this.cols*sz);
    }
    
    for(let y = 0; y <= this.rows; y++){
      g.line(0, y*sz, this.cols*sz, y*sz);
    }
    
    g.pop();
  }
}