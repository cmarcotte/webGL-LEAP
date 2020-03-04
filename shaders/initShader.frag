#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * initShader   :   Initialize Beeler-Reuter Variables 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 06 Dec 2017 03:52:47 PM EST
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float;

/*------------------------------------------------------------------------
 * Interface variables : 
 * varyings change to "in" types in fragment shaders 
 * and "out" in vertexShaders
 *------------------------------------------------------------------------
 */
in vec2 pixPos ;

/*------------------------------------------------------------------------
 * It turns out for my current graphics card the maximum number of 
 * drawBuffers is limited to 8 
 *------------------------------------------------------------------------
 */
layout (location = 0 )  out vec4 outFuvws ;
layout (location = 1 )  out vec4 outSuvws ;

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    vec4 uvws = vec4(0.0,1.0,1.0,0.05) ;
    /*
    if ( pixPos.x < 0.5 && pixPos.y<0.5 ){
        uvws.r = 1.0 ;
    }
    if (pixPos.y>0.5 && pixPos.x <0.5){
        uvws.b =0. ;
        uvws.g =0. ;
    }
    */
    outFuvws = uvws ;
    outSuvws = uvws ;

    return ;
}
