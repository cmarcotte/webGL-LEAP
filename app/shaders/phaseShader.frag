#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * phaseShader  :   create a phase field for the structure
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Mon 10 Feb 2020 14:14:11 (EST)
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

precision highp float ;
precision highp int ;

uniform sampler2D   holes ;

in vec2 cc ;

layout (location = 0) out vec4 phase ;

void main(){

    // Plane
    /*
    phase = vec4(1.) ;
    */

    // Annulus
    
    float l = length(cc-vec2(0.5)) ;
    if (l<0.50 && l>0.00){
        phase = vec4(1.) ;
    }else{
        phase = vec4(0.) ;
    }
    
    
    // Elliptic interior; 1.0 < a,b
    /*
    float a = 1.0;
    float b = 10.0;
    float l = length(vec2(a,b)*(cc-vec2(0.5)));
    if (l<0.42){
        phase = vec4(1.) ;
    }else{
        phase = vec4(0.) ;
    }
    */
    
    // Elliptic exterior; 1.0 < a,b
    /*
    float a = 1.0;
    float b = 10.0;
    float l = length(vec2(a,b)*(cc-vec2(0.5)));
    if (l>0.4){
        phase = vec4(1.) ;
    }else{
        phase = vec4(0.) ;
    }
    */
    
    // Wave of variable curvature
    /*
    if (cc.x > 0.75 + 0.25*cos(4.0*2.0*3.14159612* cc.y * cc.y)){
        phase = vec4(0.) ;
    }else{
        phase = vec4(1.) ;
    }
    */
    
    // Set of holes in a disk
    /*
    // Disk first
    float l = length(cc-vec2(0.5));
    if (l < 0.42) {
        phase = vec4(1.);
    }else{
        phase = vec4(0.);
    }
    var xhole = [0.1,0.2,0.7,0.9];
    var yhole = [0.1,0.2,0.7,0.9];
    var rhole = [0.1,0.1,0.05,0.05];
    var hole_index;

    for (hole_index = 0; hole_index < rhole.length; hole_index++) {
        l = length(cc-vec2(xhole[hole_index],yhole[hole_index])) ;
        if ( l < rhole[hole_index]){
            phase = vec4(0.);
        }
    }
    */
    
    // load in hole texture
    vec4 h = texture(holes, cc) ;
    
    // apply hole texture to existing phase domain definiton
    phase = phase*h.r ;
    
    return ;
}   
