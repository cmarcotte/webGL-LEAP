#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * fdCoefShader :   finite difference coeficient shader
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Mon 10 Feb 2020 14:24:52 (EST)
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float ;
precision highp int ;

in vec2 cc ,pixPos  ;

uniform sampler2D   phaseTxt ;

layout (location = 0) out vec4 lrceOut ;
layout (location = 1) out vec4 udceOut ;

void main(){
    vec2 size = vec2(textureSize(phaseTxt, 0 )) ;
    float width = size.x ;
    float height = size.y ;
    vec2 ii = vec2(1.,0.)/size ;
    vec2 jj = vec2(0.,1.)/size ;


    float r, g, b, a ;                      /* rgba values               */
    float rr, gg, bb, aa;
    
    vec2   w, e, n, s ;
    w = pixPos - ii ;
    e = pixPos + ii ;
    n = pixPos + jj ; 
    s = pixPos - jj ;

    float C, L, R, U, D ;
    C = texture( phaseTxt, pixPos ).r ;
    L = texture( phaseTxt, w      ).r ;
    R = texture( phaseTxt, e      ).r ;
    U = texture( phaseTxt, n      ).r ;
    D = texture( phaseTxt, s      ).r ;
    
    /* Assume that L = r, R = g, C_LR = b, E_x = a */
    r =  1.0 ;
    g =  1.0 ;
    b = -2.0 ;
    a =  0.0 ;
    
    /* No tissue at pixpos */   
    if ( C < 0.5 ){
           r = 0.0 ;
           g = 0.0 ;
           b = 0.0 ;
           a = 0.0 ;        
        }
                
    /*  L R = 1 0 */
    if ( C > 0.5 &&
         L > 0.5 && R < 0.5 ){
            r =  2.0 ;
            g =  0.0 ;
            b = -2.0 ;
            a =  1.0 ;
     }
        
    /*  L R = 0 1 */
    if ( C > 0.5 &&
         L < 0.5 && R > 0.5 ){
            r =  0.0 ;
            g =  2.0 ;
            b = -2.0 ;
            a = -1.0 ;
     }
     
     /*  L R = 0 0 */
    if ( C > 0.5 &&
         L < 0.5 && R < 0.5 ){
            r =  0.0 ;
            g =  0.0 ;
            b =  0.0 ;
            a =  0.0 ;
     }
     
     /* left right boundary */
     if ( pixPos.x < (1.0/width) ){
            r =  0.0 ;
            g =  2.0 ;
            b = -2.0 ;
            a = 0.0  ; //-1.0 ;
    }
    
    if ( pixPos.x > (1.0 - 1.0/width) ){
            r =  2.0 ;
            g =  0.0 ;
            b = -2.0 ;
            a =  0.0 ;  //1.0 ;
    }
        
    /* Assume that U = rr, D = gg, C_UD = bb, E_y = aa */
    rr =  1.0 ;
    gg =  1.0 ;
    bb = -2.0 ;
    aa =  0.0 ;
    
    /* No tissue at pixpos */   
    if ( C < 0.5 ){
           rr = 0.0 ;
           gg = 0.0 ;
           bb = 0.0 ;
           aa = 0.0 ;       
        }
                
    /* U D = 1 0 */
    if ( C > 0.5 &&
         U > 0.5 && D < 0.5 ){
            rr =  2.0 ;
            gg =  0.0 ;
            bb = -2.0 ;
            aa = -1.0 ;
     }
        
    /* U D = 0 1 */
    if ( C > 0.5 &&
         U < 0.5 && D > 0.5 ){
            rr =  0.0 ;
            gg =  2.0 ;
            bb = -2.0 ;
            aa =  1.0 ;
     }
     
     /* U D = 0 0 */
    if ( C > 0.5 &&
         U < 0.5 && D < 0.5 ){
            rr =  0.0 ;
            gg =  0.0 ;
            bb =  0.0 ;
            aa =  0.0 ;
     }
     
     /* up down boundary */
     if ( pixPos.y < (1.0/height) ){
           rr =  2.0 ;
           gg =  0.0 ;
           bb = -2.0 ;
           aa =  0.0 ;   //-1.0 ;
     }
     
     if ( pixPos.y > (1.0 - 1.0/height) ){
           rr =  0.0 ;
           gg =  2.0 ;
           bb = -2.0 ;
           aa =  0.0 ;  //1.0 ;
     }
    
    lrceOut = vec4(r,g,b,a);    
    udceOut = vec4(rr,gg,bb,aa);

}
