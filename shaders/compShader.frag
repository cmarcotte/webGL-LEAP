#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * compShader   :   4V-Master Model
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 06 Dec 2017 03:53:00 PM EST
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float;
precision highp int ;

/*------------------------------------------------------------------------
 * Interface variables : 
 * varyings change to "in" types in fragment shaders 
 * and "out" in vertexShaders
 *------------------------------------------------------------------------
 */
in vec2 pixPos ;

uniform sampler2D   inUvws ;
uniform sampler2D   inLrce ;
uniform sampler2D   inUdce ;

uniform float       Ex, Ey ;

uniform float       ds_x, ds_y ;
uniform float       dt ;
uniform float       diffCoef, C_m ;

uniform float       tau_m_v1    ;
uniform float       tau_m_v2    ;
uniform float       tau_p_v     ;
uniform float       tau_m_w1    ;
uniform float       tau_m_w2    ;
uniform float       tau_p_w1    ;
uniform float       tau_p_w2    ;
uniform float       tau_s1      ;
uniform float       tau_s2      ;
uniform float       tau_fi      ;
uniform float       tau_o1      ;
uniform float       tau_o2      ;
uniform float       tau_so1     ;
uniform float       tau_so2     ;
uniform float       tau_si1     ;
uniform float       tau_si2     ;
uniform float       tau_winf    ;
uniform float       theta_v     ;
uniform float       theta_p_v   ;
uniform float       theta_m_v   ;
uniform float       theta_vinf  ;
uniform float       theta_w     ;
uniform float       theta_winf  ;
uniform float       theta_so    ;
uniform float       theta_si    ;
uniform float       theta_p_si  ;
uniform float       theta_si_c  ;
uniform float       theta_s     ;
uniform float       theta_o     ;
uniform float       k_m_w       ;
uniform float       k_p_w       ;
uniform float       k_s         ;
uniform float       k_so        ;
uniform float       k_si        ;
uniform float       k_si1       ;
uniform float       k_si2       ;
uniform float       k_si_c      ;
uniform float       u_m_w       ;
uniform float       u_s         ;
uniform float       u_o         ;
uniform float       u_u         ;
uniform float       u_so        ;
uniform float       w_sinf      ;
uniform float       w_p_c       ;
uniform float       s_c         ;
uniform float       alpha_w     ;
uniform float       alpha_si    ;
uniform float       beta_v      ;
uniform float       gamma_si    ;
uniform float       delta_w     ;
uniform float       u_p_w       ;


#define vSampler  inUvws 
/*========================================================================
 * Tanh
 *========================================================================
 */
float Tanh(float x){
    if ( x < -3.) return -1. ;
    if ( x > 3. ) return 1.  ;
    else return x*(27.+x*x)/(27.+9.*x*x) ;
}

/*------------------------------------------------------------------------
 * It turns out for my current graphics card the maximum number of 
 * drawBuffers is limited to 8 
 *------------------------------------------------------------------------
 */
layout (location = 0 )  out vec4 outUvws ;

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    vec2    cc = pixPos ;
    vec2    size    = vec2(textureSize( vSampler, 0 ) );
    float   cddx    = size.x/ds_x ;
    float   cddy    = size.y/ds_y ;

    cddx *= cddx ;
    cddy *= cddy ;

/*------------------------------------------------------------------------
 * reading from textures
 *------------------------------------------------------------------------
 */
    vec4    C = texture( inUvws , pixPos ) ;
    float   u = C.r ;
    float   v = C.g ;
    float   w = C.b ;
    float   s = C.a ;
    
/*------------------------------------------------------------------------
 * Additional heaviside functions
 *------------------------------------------------------------------------
 */ 
    float  H_theta_v       = ( u > theta_v     )  ? 1.0:0.0 ;
    float  H_theta_m_v     = ( u > theta_m_v   )  ? 1.0:0.0 ;
    float  H_theta_w       = ( u > theta_w     )  ? 1.0:0.0 ;
    float  H_theta_so      = ( u > theta_so    )  ? 1.0:0.0 ;
    float  H_theta_si      = ( u > theta_si    )  ? 1.0:0.0 ;
    float  H_theta_s       = ( u > theta_s     )  ? 1.0:0.0 ;
    float  H_theta_o       = ( u > theta_o     )  ? 1.0:0.0 ;
    float  H_theta_vinf    = ( u > theta_vinf  )  ? 1.0:0.0 ;
    float  H_theta_winf    = ( u > theta_winf  )  ? 1.0:0.0 ;

/*-------------------------------------------------------------------------
 * Calculating right hand side vars
 *-------------------------------------------------------------------------
 */
    float tau_m_v = ( 1.0 - H_theta_m_v )*tau_m_v1 
                    + H_theta_m_v*tau_m_v2 ;
    float tau_m_w = tau_m_w1 
        + (tau_m_w2-tau_m_w1)*(1.+Tanh(k_m_w*(u-u_m_w)))*0.5 ;
    float  tau_p_w = tau_p_w1 
        + (tau_p_w2-tau_p_w1)*(1.+Tanh(k_p_w*(
                        delta_w*(w-w_p_c) + (1.-delta_w)*(u-u_p_w))))*0.5 ;
    float tau_s   = (1. - H_theta_s)*tau_s1 + H_theta_s*tau_s2 ;
    float tau_o   = (1. - H_theta_o)*tau_o1 + H_theta_o*tau_o2 ;
    float tau_so  = tau_so1 
        + (tau_so2 - tau_so1)*(1.+Tanh(k_so*(u-u_so)))*0.5 ;
    float  tau_si  = tau_si1 
        + (tau_si2 - tau_si1)*(1.+Tanh(k_si*(s-s_c)))*0.5 ;
    float  tau_p_si = alpha_si*(1.+exp(k_si1*(u-theta_p_si)))/
        (1.-Tanh(k_si2*(u-theta_p_si))) ;

    float v_inf = 1. - H_theta_vinf ;
    float w_inf = (1.-H_theta_winf)*(1.-u/tau_winf) 
            + H_theta_winf*w_sinf ;
/*------------------------------------------------------------------------
 * v
 *------------------------------------------------------------------------
 */
    float  dv2dt   =   (1.-H_theta_v)*(v_inf - v)/tau_m_v 
                    -   H_theta_v * v /tau_p_v ;
    v += dv2dt*dt ;

/*------------------------------------------------------------------------
 * w
 *------------------------------------------------------------------------
 */
    float  wx  =   (2.-alpha_w)*(3.-alpha_w)*(4.-alpha_w)*w/6.0
                +   (alpha_w-1.)*(3.-alpha_w)*(4.-alpha_w)*0.5*w*w 
                +   (alpha_w-1.)*(alpha_w-2.)*(4.-alpha_w)*0.5*w*w*w
                +   (alpha_w-1.)*(alpha_w-2.)*(alpha_w-3.)*w*w*w*w/6. ;
    
    float dw2dt    = (1.-H_theta_w)*(w_inf-wx)/tau_m_w
                    - H_theta_w*w/tau_p_w ;
    w += dw2dt*dt ;

/*------------------------------------------------------------------------
 * s
 *------------------------------------------------------------------------
 */
    float   ds2dt   = ((1.+tanh(k_s*(u-u_s)))*0.5-s)/tau_s ;
    s += ds2dt*dt ;

/*------------------------------------------------------------------------
 * I_sum
 *------------------------------------------------------------------------
 */ 
    float  J_fi    = -v*H_theta_v*(u-theta_p_v)*(u_u - u )/tau_fi ;
    float  J_so    = (u - u_o)*(1.-H_theta_so)*(1.-beta_v*v)/tau_o
                    + H_theta_so/tau_so ;
    float  J_si ;  
    if (gamma_si > 0.5) 
        J_si = -H_theta_si*w*s/tau_si ;
    else
        J_si = -(1.+tanh(k_si_c*(u-theta_si_c)))*w/tau_p_si ;

    float  I_sum   = J_fi + J_so + J_si ;

/*-------------------------------------------------------------------------
 * Laplacian
 *-------------------------------------------------------------------------
 */
    vec2 ii = vec2(1.0,0.0)/size ;
    vec2 jj = vec2(0.0,1.0)/size ;    

    vec4 lrce = texture( inLrce, cc) ;
    vec4 udce = texture( inUdce, cc) ;
    
    float gamma = 1./3. ;

    float du2dt = (  lrce.g*texture(vSampler,cc+ii).r
                    +lrce.b*C.r
                    +lrce.r*texture(vSampler,cc-ii).r   
                    +lrce.a*2.*Ex  )*cddx
                +(   udce.g*texture(vSampler,cc-jj).r
                    +udce.b*C.r
                    +udce.r*texture(vSampler,cc+jj).r     
                    +udce.a*2.*Ey    )*cddx

                ;
    du2dt *= diffCoef ;

/*------------------------------------------------------------------------
 * Time integration for membrane potential
 *------------------------------------------------------------------------
 */
    du2dt -= I_sum/C_m ;
    u += du2dt*dt ;

/*------------------------------------------------------------------------
 * ouputing the shader
 *------------------------------------------------------------------------
 */
    outUvws = vec4(u,v,w,s);

    return ;
}
