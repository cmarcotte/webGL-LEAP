/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   2D - 4-Variable Master Model 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 06 Dec 2017 04:26:41 PM EST
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
define([    'require',
            'shader!initShader.frag',
            'shader!compShader.frag',
            'shader!paceShader.frag',
            'shader!clickShader.frag',
            'shader!bvltShader.frag',
            'shader!phaseShader.frag',
            'shader!fdCoefShader.frag',
            'image!./holes.png',
            ],
function(   require,
            initShader,
            compShader,
            paceShader,
            clickShader,
            bvltShader,
            phaseShader,
            fdCoefShader,
            holesImage,
            ){
"use strict" ;

/*========================================================================
 * Global Parameters
 *========================================================================
 */
var log = console.log ;
var params ;
var env ;
var gui ;

/*========================================================================
 * createGui
 *========================================================================
 */
function createGui(){
    env.gui = new Abubu.Gui() ;
    gui = env.gui.addPanel({width:300}) ;

/*-------------------------------------------------------------------------
 * Model Parameters
 *-------------------------------------------------------------------------
 */
    gui.mdlPrmFldr  =   gui.addFolder( 'Model Parameters'   ) ;
    gui.mdlPrmFldr.add( env, 'paramType',
                        [   
                        'Human-Epi'         ,
                        'New-Brugada'       ,
                        'MAP-Brugada'       ,
                        'Epi'               ,
                        'Endo'              ,
                        'Mid-Myo'           ,
                        'PB'                ,
                        'TNNP'              ,
                        'Atrial-P1'         ,
                        'Atrial-P1-Alt'     ,
                        'Atrial-P2'         ,
                        'Atrial-P3'         ,
                        'Atrial-P4'         ,
                        'Atrial-P5'         ,
                        'Atrial-Original'   ,
                        'Rabbit-CytoD'      ,
                        'Rabbit-Dam'        ,
                        'Pig-Ventricle'     ,
                        'Canine-Epi_37'     ,
                        'Canine-Endo_37'    ,
  ] ).name('Set No.').onChange(changeParamType) ;

    addCoeficients(     gui.mdlPrmFldr, ['C_m', 'diffCoef'] ,
                        [env.comp1,env.comp2], {min:0}) ;

    addCoeficients( gui.mdlPrmFldr, [
            'tau_m_v1'      ,   
            'tau_m_v2'      ,   
            'tau_p_v'       ,   
            'tau_m_w1'      ,   
            'tau_m_w2'      ,   
            'tau_p_w1'      ,   
            'tau_p_w2'      ,   
            'tau_s1'        ,   
            'tau_s2'        ,   
            'tau_fi'        ,   
            'tau_o1'        ,   
            'tau_o2'        ,   
            'tau_so1'       ,   
            'tau_so2'       ,   
            'tau_si1'       ,   
            'tau_si2'       ,   
            'tau_winf'      ,   
            'theta_v'       ,   
            'theta_p_v'     ,   
            'theta_m_v'     ,   
            'theta_vinf'    ,   
            'theta_w'       ,   
            'theta_winf'    ,   
            'theta_so'      ,   
            'theta_si'      ,   
            'theta_p_si'    ,   
            'theta_si_c'    ,   
            'theta_s'       ,   
            'theta_o'       ,   
            'k_m_w'         ,   
            'k_p_w'         ,   
            'k_s'           ,   
            'k_so'          ,   
            'k_si'          ,   
            'k_si1'         ,   
            'k_si2'         ,   
            'k_si_c'        ,   
            'u_m_w'         ,   
            'u_s'           ,   
            'u_o'           ,   
            'u_u'           ,    
            'u_so'          ,    
            'w_sinf'        ,    
            'w_p_c'         ,    
            's_c'           ,    
            'alpha_w'       ,    
            'alpha_si'      ,    
            'beta_v'        ,    
            'gamma_si'      ,
            'delta_w'       ,
            'u_p_w'
                    ] ,
                    [env.comp1,env.comp2 ] ) ;
    changeParamType() ;

/*------------------------------------------------------------------------
 * Solver Parameters
 *------------------------------------------------------------------------
 */
    gui.slvPrmFldr  = gui.addFolder( 'Solver Parameters' ) ;
    gui.slvPrmFldr.add( env, 'dt').name('Delta t').onChange(
         function(){
            Abubu.setUniformInSolvers('dt', env.dt,
                    [env.comp1,env.comp2 ]) ;
         }
    );

    gui.slvPrmFldr.add( env, 'ds_x' ).name( 'Domain size-x').onChange(
        function(){
            Abubu.setUniformInSolvers('ds_x', env.ds_x,
                    [env.comp1,env.comp2 ]) ;
        }
    ) ;
    gui.slvPrmFldr.add( env, 'ds_y' ).name( 'Domain size-y').onChange(
        function(){
            Abubu.setUniformInSolvers('ds_y', env.ds_y,
                    [env.comp1,env.comp2 ]) ;
        }
    ) ;

    gui.slvPrmFldr.add( env, 'width').name( 'x-resolution' )
    .onChange( function(){
        Abubu.resizeRenderTargets(
                [
                env.fuvws,
                env.suvws,
                env.phase,
                env.lrce,
                env.udce], env.width, env.height);
        env.phaseSolver.render() ;
        env.fdCoefSolver.render() ;
    } ) ;

    gui.slvPrmFldr.add( env, 'height').name( 'y-resolution' )
    .onChange( function(){
        Abubu.resizeRenderTargets(
            [
                env.fuvws,
                env.suvws
            ],
            env.width,
            env.height);
    } ) ;

/*------------------------------------------------------------------------
 * Display Parameters
 *------------------------------------------------------------------------
 */
    gui.dspPrmFldr  = gui.addFolder( 'Display Parameters' ) ;
    gui.dspPrmFldr.add( env, 'colormap', Abubu.getColormapList() )
                .onChange(  function(){
                                env.disp.setColormap(env.colormap);
                                refreshDisplay() ;
                            }   ).name('Colormap') ;

    gui.dspPrmFldr.add( env, 'probeVisiblity').name('Probe Visiblity')
        .onChange(function(){
            env.disp.setProbeVisiblity(env.probeVisiblity);
            refreshDisplay() ;
        } ) ;
    gui.dspPrmFldr.add( env, 'frameRate').name('Frame Rate Limit')
        .min(60).max(120000).step(60)

    gui.dspPrmFldr.add( env, 'timeWindow').name('Signal Window [ms]')
    .onChange( function(){
        env.plot.updateTimeWindow(env.timeWindow) ;
        refreshDisplay() ;
    } ) ;
    //gui.dspPrmFldr.open() ;

/*------------------------------------------------------------------------
 * tipt
 *------------------------------------------------------------------------
 */
    gui.tptPrmFldr = gui.dspPrmFldr.addFolder( 'Tip Trajectory') ;
    gui.tptPrmFldr.add( env, 'tiptVisiblity' )
        .name('Plot Tip Trajectory?')
        .onChange(function(){
            env.disp.setTiptVisiblity(env.tiptVisiblity) ;
            refreshDisplay() ;
        } ) ;
    gui.tptPrmFldr.add( env, 'tiptThreshold').name( 'Threshold [mv]')
        .onChange( function(){
                env.disp.setTiptThreshold( env.tiptThreshold ) ;
                } ) ;
    //gui.tptPrmFldr.open() ;    

/*------------------------------------------------------------------------
 * save
 *------------------------------------------------------------------------
 */
    var svePrmFldr = gui.addFolder('Save Canvases') ;
    svePrmFldr.add( env, 'savePlot2DPrefix').name('File Name Prefix') ;
    svePrmFldr.add( env, 'savePlot2D' ).name('Save Plot2D') ;


/*------------------------------------------------------------------------
 * shock
 *------------------------------------------------------------------------
 */
    var shockFldr = gui.addFolder('Shock') ;
    shockFldr.add(env, 'Ex') ;
    shockFldr.add(env, 'Ey') ;
    shockFldr.add(env, 'duration').name('Duration [ms]') ;
    shockFldr.add(env, 'rotation').name('Cycles') ;
    shockFldr.add(env, 'phaseoffset').name('Phase offset').min(0.0).max(0.5*Math.PI).step(Math.PI/64) ;
    shockFldr.add(env, 'shock').name('Apply defib shock') ; 
    
    shockFldr.open() ;

/*------------------------------------------------------------------------
 * Simulation
 *------------------------------------------------------------------------
 */
    gui.smlPrmFldr  = gui.addFolder(    'Simulation'    ) ;
    gui.smlPrmFldr.add( env,  'clickRadius' )
        .min(0.01).max(1.0).step(0.01)
        .name('Click Radius')
        .onChange(function(){
                env.click.setUniform('clickRadius',env.clickRadius) ;
                } ) ;
    gui.smlPrmFldr.add( env,
        'clicker',
        [   'Conduction Block',
            'Pace Region',
            'Signal Loc. Picker',
            'Autopace Loc. Picker'  ] ).name('Clicker Type') ;

    gui.smlPrmFldr.add( env, 'time').name('Solution Time [ms]').listen() ;

    gui.smlPrmFldr.add( env, 'initialize').name('Initialize') ;
    gui.smlPrmFldr.add( env, 'solve').name('Solve/Pause') ;
    gui.smlPrmFldr.open() ;

/*------------------------------------------------------------------------
 * addCoeficients
 *------------------------------------------------------------------------
 */
    function addCoeficients( fldr,
            coefs,
            solvers ,
            options ){
        var coefGui = {} ;
        var min = undefined ;
        var max = undefined ;
        if (options != undefined ){
            if (options.min != undefined ){
                min = options.min ;
            }
            if (options.max != undefined ){
                max = options.max ;
            }
        }
        for(var i=0; i<coefs.length; i++){
            var coef = addCoef(fldr,coefs[i],solvers) ;
            if (min != undefined ){
                coef.min(min) ;
            }
            if (max != undefined ){
                coef.max(max) ;
            }
            coefGui[coefs[i]] = coef ;
        }
        return coefGui ;

        /* addCoef */
        function addCoef( fldr,
                coef,
                solvers     ){
            var coefGui =   fldr.add( env, coef )
                .onChange(
                        function(){
                        Abubu.setUniformInSolvers(  coef,
                                env[coef],
                                solvers  ) ;
                        } ) ;

            return coefGui ;

        }
    }

    return ;
} /* End of createGui */

/*------------------------------------------------------------------------
 * defibrillation shock pattern
 *------------------------------------------------------------------------
 */

function defibshock(){
    if ( env.shocktime > 0 && env.running ){
        if ((env.time-env.shocktime) < 3*env.dt){
            // Do this only O(1) times, not constantly while applying.
            console.log(`Applying shock of strength E=[${env.Ex},${env.Ey}] and ${env.rotation} rotations over ${env.duration} ms with phase offset ${env.phaseoffset}...`)
        }
        var t0 = env.time-env.shocktime;
        if ( t0 < env.duration){ 
            var tau = 2*Math.PI * (env.rotation*t0/env.duration);
            env.comp1.uniforms.Ex.value = env.Ex * Math.sin(tau);
            env.comp2.uniforms.Ex.value = env.Ex * Math.sin(tau);
            env.comp1.uniforms.Ey.value = env.Ey * Math.sin(tau+env.phaseoffset);
            env.comp2.uniforms.Ey.value = env.Ey * Math.sin(tau+env.phaseoffset);
        }
        else{
            if (env.time-env.shocktime >= env.duration) {
                
                env.comp1.uniforms.Ex.value = 0.0;
                env.comp2.uniforms.Ex.value = 0.0;
                env.comp1.uniforms.Ey.value = 0.0;
                env.comp2.uniforms.Ey.value = 0.0;
                env.shocktime = -1;
                console.log(`Shock done.`)
            }
        }
    }
}

/*------------------------------------------------------------------------
 * changeParamType
 *------------------------------------------------------------------------
 */
function changeParamType(){
    var paramVals = [] ;
    switch (params['paramType']){
        case 'Human-Epi':
            env.tau_m_v1    = 60.0       ;
            env.tau_m_v2    = 1150       ;
            env.tau_p_v     = 1.4506     ;
            env.tau_m_w1    = 60.0       ;
            env.tau_m_w2    = 15         ;
            env.tau_p_w1    = 200.0      ;
            env.tau_p_w2    = 200.0      ;
            env.tau_s1      = 2.7342     ;
            env.tau_s2      = 16.0       ;
            env.tau_fi      = 0.11       ;
            env.tau_o1      = 400.       ;
            env.tau_o2      = 6.0        ;
            env.tau_so1     = 30.0181    ;
            env.tau_so2     = 0.9957     ;
            env.tau_si1     = 1.8875     ;
            env.tau_si2     = 1.8875     ;
            env.tau_winf    = 0.07       ;
            env.theta_v     = 0.3        ;
            env.theta_p_v   = 0.3        ;
            env.theta_m_v   = 0.006      ;
            env.theta_vinf  = 0.006      ;
            env.theta_w     = 0.13       ;
            env.theta_winf  = 0.13       ;
            env.theta_so    = 0.13       ;
            env.theta_si    = 0.13       ;
            env.theta_p_si  = 0.13       ;
            env.theta_si_c  = 0.13       ;
            env.theta_s     = 0.13       ;
            env.theta_o     = 0.006      ;
            env.k_m_w       = 65.0       ;
            env.k_p_w       = 1.0        ;
            env.k_s         = 2.0994     ;
            env.k_so        = 2.0458     ;
            env.k_si        = 1.0        ;
            env.k_si1       = 1.0        ;
            env.k_si2       = 1.0        ;
            env.k_si_c      = 1.0        ;
            env.u_m_w       = 0.03       ;
            env.u_s         = 0.9087     ;
            env.u_o         = 0.0        ;
            env.u_u         = 1.55       ;
            env.u_so        = 0.65       ;
            env.w_sinf      = 0.94       ;
            env.w_p_c       = 1.0        ;
            env.s_c         = 1.0        ;
            env.alpha_w     = 1.0        ;
            env.alpha_si    = 1.0        ;
            env.beta_v      = 0.0        ;
            env.gamma_si    = 1.0        ;
            env.delta_w     = 1.0        ;
            env.u_p_w       = 1.0        ;
            break ;
        case 'New-Brugada':
            env.tau_m_v1    = 60        ;
            env.tau_m_v2    = 50        ;
            env.tau_p_v     = 1.4506    ;
            env.tau_m_w1    = 60        ;
            env.tau_m_w2    = 15        ;
            env.tau_p_w1    = 0.050082  ;
            env.tau_p_w2    = 131.5     ;
            env.tau_s1      = 2.7342    ;
            env.tau_s2      = 35        ;
            env.tau_fi      = 0.04      ;
            env.tau_o1      = 400       ;
            env.tau_o2      = 6         ;
            env.tau_so1     = 30.0181   ;
            env.tau_so2     = 0.9957    ;
            env.tau_si1     = 7.5476    ;
            env.tau_si2     = 1.8875    ;
            env.tau_winf    = 0.07      ;
            env.theta_v     = 0.3       ;
            env.theta_p_v   = 0.3       ;
            env.theta_m_v   = 0.006     ;
            env.theta_vinf  = 2         ;
            env.theta_w     = 0.13      ;
            env.theta_winf  = 0.13      ;
            env.theta_so    = 0.13      ;
            env.theta_si    = 0.13      ;
            env.theta_p_si  = 0.13      ;
            env.theta_si_c  = 0.13      ;
            env.theta_s     = 0.13      ;
            env.theta_o     = 0.006     ;
            env.k_m_w       = 65        ;
            env.k_p_w       = 5.7       ;
            env.k_s         = 5.8       ;
            env.k_so        = 2.0458    ;
            env.k_si        = 97.8      ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.03      ;
            env.u_s         = 0.35      ;
            env.u_o         = 0         ;
            env.u_u         = 1         ;
            env.u_so        = 0.65      ;
            env.w_sinf      = 0.94      ;
            env.w_p_c       = 0.15      ;
            env.s_c         = 0.71752   ;
            env.alpha_w     = 1.0       ;
            env.alpha_si    = 1.0       ;
            env.beta_v      = 0.0       ;
            env.gamma_si    = 1.0       ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;
        case 'MAP-Brugada':
            env.tau_m_v1    = 15.06     ;
            env.tau_m_v2    = 15        ;
            env.tau_p_v     = 3.33      ;
            env.tau_m_w1    = 300       ;
            env.tau_m_w2    = 300       ;
            env.tau_p_w1    = 25.41     ;
            env.tau_p_w2    = 226.2     ;
            env.tau_s1      = 4.242     ;
            env.tau_s2      = 25.21     ;
            env.tau_fi      = 0.05      ;
            env.tau_o1      = 8.854     ;
            env.tau_o2      = 8.854     ;
            env.tau_so1     = 193.9     ;
            env.tau_so2     = 0.5640    ;
            env.tau_si1     = 5.834     ;
            env.tau_si2     = 0.1567    ;
            env.tau_winf    = 0.07      ;
            env.theta_v     = 0.13      ;
            env.theta_p_v   = 0.13      ;
            env.theta_m_v   = 0.955     ;
            env.theta_vinf  = 2         ;
            env.theta_w     = 0.08801   ;
            env.theta_winf  = 0         ;
            env.theta_so    = 0.2564    ;
            env.theta_si    = 0         ;
            env.theta_p_si  = 1         ;
            env.theta_si_c  = 1         ;
            env.theta_s     = 0.3602    ;
            env.theta_o     = 0.955     ;
            env.k_m_w       = 65        ;
            env.k_p_w       = 6.199     ;
            env.k_s         = 4.825     ;
            env.k_so        = 3.135     ;
            env.k_si        = 4.732     ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.03      ;
            env.u_s         = 0.4363    ;
            env.u_o         = 0         ;
            env.u_u         = 0.6       ;
            env.u_so        = 0.11      ;
            env.w_sinf      = 1         ;
            env.w_p_c       = 0.464     ;
            env.s_c         = 0.6419    ;
            env.alpha_w     = 1         ;
            env.alpha_si    = 1         ;
            env.beta_v      = 0         ;
            env.gamma_si    = 1         ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;
        case 'Epi':
            env.tau_m_v1    = 60        ;
            env.tau_m_v2    = 1150      ;
            env.tau_p_v     = 1.4506    ;
            env.tau_m_w1    = 60        ;
            env.tau_m_w2    = 15        ;
            env.tau_p_w1    = 200       ;
            env.tau_p_w2    = 200       ;
            env.tau_s1      = 2.7342    ;
            env.tau_s2      = 16        ;
            env.tau_fi      = 0.11      ;
            env.tau_o1      = 400       ;
            env.tau_o2      = 6         ;
            env.tau_so1     = 30.0181   ;
            env.tau_so2     = 0.9957    ;
            env.tau_si1     = 1.8875    ;
            env.tau_si2     = 1.8875    ;
            env.tau_winf    = 0.07      ;
            env.theta_v     = 0.3       ;
            env.theta_p_v   = 0.3       ;
            env.theta_m_v   = 0.006     ;
            env.theta_vinf  = 0.006     ;
            env.theta_w     = 0.13      ;
            env.theta_winf  = 0.006     ;
            env.theta_so    = 0.13      ;
            env.theta_si    = 0.13      ;
            env.theta_p_si  = 1         ;
            env.theta_si_c  = 1         ;
            env.theta_s     = 0.13      ;
            env.theta_o     = 0.006     ;
            env.k_m_w       = 65        ;
            env.k_p_w       = 65        ;
            env.k_s         = 2.0994    ;
            env.k_so        = 2.0458    ;
            env.k_si        = 1         ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.03      ;
            env.u_s         = 0.9087    ;
            env.u_o         = 0         ;
            env.u_u         = 1.55      ;
            env.u_so        = 0.65      ;
            env.w_sinf      = 0.94      ;
            env.w_p_c       = 0         ;
            env.s_c         = 0         ;
            env.alpha_w     = 1         ;
            env.alpha_si    = 1         ;
            env.beta_v      = 0         ;
            env.gamma_si    = 1         ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;

        case 'Endo':
            env.tau_m_v1    = 75        ;
            env.tau_m_v2    = 10        ;
            env.tau_p_v     = 1.4506    ;
            env.tau_m_w1    = 6         ;
            env.tau_m_w2    = 140       ;
            env.tau_p_w1    = 280       ;
            env.tau_p_w2    = 280       ;
            env.tau_s1      = 2.7342    ;
            env.tau_s2      = 2         ;
            env.tau_fi      = 0.1       ;
            env.tau_o1      = 470       ;
            env.tau_o2      = 6         ;
            env.tau_so1     = 40        ;
            env.tau_so2     = 1.2       ;
            env.tau_si1     = 2.9013    ;
            env.tau_si2     = 2.9013    ;
            env.tau_winf    = 0.0273    ;
            env.theta_v     = 0.3       ;
            env.theta_p_v   = 0.3       ;
            env.theta_m_v   = 0.2       ;
            env.theta_vinf  = 0.2       ;
            env.theta_w     = 0.13      ;
            env.theta_winf  = 0.006     ;
            env.theta_so    = 0.13      ;
            env.theta_si    = 0.13      ;
            env.theta_p_si  = 1         ;
            env.theta_si_c  = 1         ;
            env.theta_s     = 0.13      ;
            env.theta_o     = 0.006     ;
            env.k_m_w       = 200       ;
            env.k_p_w       = 200       ;
            env.k_s         = 2.0994    ;
            env.k_so        = 2         ;
            env.k_si        = 1         ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.016     ;
            env.u_s         = 0.9087    ;
            env.u_o         = 0         ;
            env.u_u         = 1.56      ;
            env.u_so        = 0.65      ;
            env.w_sinf      = 0.78      ;
            env.w_p_c       = 0         ;
            env.s_c         = 0         ;
            env.alpha_w     = 1         ;
            env.alpha_si    = 1         ;
            env.beta_v      = 0         ;
            env.gamma_si    = 1         ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;
        case 'Mid-Myo':
            env.tau_m_v1    = 80        ;
            env.tau_m_v2    = 1.4506    ;
            env.tau_p_v     = 1.4506    ;
            env.tau_m_w1    = 70        ;
            env.tau_m_w2    = 8         ;
            env.tau_p_w1    = 280       ;
            env.tau_p_w2    = 280       ;
            env.tau_s1      = 2.7342    ;
            env.tau_s2      = 4         ;
            env.tau_fi      = 0.078     ;
            env.tau_o1      = 410       ;
            env.tau_o2      = 7         ;
            env.tau_so1     = 91        ;
            env.tau_so2     = 0.8       ;
            env.tau_si1     = 3.3849    ;
            env.tau_si2     = 3.3849    ;
            env.tau_winf    = 0.01      ;
            env.theta_v     = 0.3       ;
            env.theta_p_v   = 0.3       ;
            env.theta_m_v   = 0.1       ;
            env.theta_vinf  = 0.1       ;
            env.theta_w     = 0.13      ;
            env.theta_winf  = 0.005     ;
            env.theta_so    = 0.13      ;
            env.theta_si    = 0.13      ;
            env.theta_p_si  = 1         ;
            env.theta_si_c  = 1         ;
            env.theta_s     = 0.13      ;
            env.theta_o     = 0.005     ;
            env.k_m_w       = 200       ;
            env.k_p_w       = 200       ;
            env.k_s         = 2.0994    ;
            env.k_so        = 2.1       ;
            env.k_si        = 1         ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.016     ;
            env.u_s         = 0.9087    ;
            env.u_o         = 0         ;
            env.u_u         = 1.61      ;
            env.u_so        = 0.6       ;
            env.w_sinf      = 0.5       ;
            env.w_p_c       = 0         ;
            env.s_c         = 0         ;
            env.alpha_w     = 1         ;
            env.alpha_si    = 1         ;
            env.beta_v      = 0         ;
            env.gamma_si    = 1         ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;
        case 'PB':
            env.tau_m_v1    = 10        ;
            env.tau_m_v2    = 1150      ;
            env.tau_p_v     = 1.4506    ;
            env.tau_m_w1    = 140       ;
            env.tau_m_w2    = 6.25      ;
            env.tau_p_w1    = 326       ;
            env.tau_p_w2    = 326       ;
            env.tau_s1      = 2.7342    ;
            env.tau_s2      = 16        ;
            env.tau_fi      = 0.105     ;
            env.tau_o1      = 400       ;
            env.tau_o2      = 6         ;
            env.tau_so1     = 30.0181   ;
            env.tau_so2     = 0.9957    ;
            env.tau_si1     = 1.8875    ;
            env.tau_si2     = 1.8875    ;
            env.tau_winf    = 0.175     ;
            env.theta_v     = 0.35      ;
            env.theta_p_v   = 0.35      ;
            env.theta_m_v   = 0.175     ;
            env.theta_vinf  = 0.175     ;
            env.theta_w     = 0.13      ;
            env.theta_winf  = 0.006     ;
            env.theta_so    = 0.13      ;
            env.theta_si    = 0.13      ;
            env.theta_p_si  = 1         ;
            env.theta_si_c  = 1         ;
            env.theta_s     = 0.13      ;
            env.theta_o     = 0.006     ;
            env.k_m_w       = 65        ;
            env.k_p_w       = 65        ;
            env.k_s         = 2.0994    ;
            env.k_so        = 2.0458    ;
            env.k_si        = 1         ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.015     ;
            env.u_s         = 0.9087    ;
            env.u_o         = 0         ;
            env.u_u         = 1.45      ;
            env.u_so        = 0.65      ;
            env.w_sinf      = 0.9       ;
            env.w_p_c       = 0         ;
            env.s_c         = 0         ;
            env.alpha_w     = 1         ;
            env.alpha_si    = 1         ;
            env.beta_v      = 0         ;
            env.gamma_si    = 1         ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;

        case 'TNNP':
            env.tau_m_v1    = 60        ;
            env.tau_m_v2    = 1150      ;
            env.tau_p_v     = 1.4506    ;
            env.tau_m_w1    = 70        ;
            env.tau_m_w2    = 20        ;
            env.tau_p_w1    = 280       ;
            env.tau_p_w2    = 280       ;
            env.tau_s1      = 2.7342    ;
            env.tau_s2      = 3         ;
            env.tau_fi      = 0.11      ;
            env.tau_o1      = 6         ;
            env.tau_o2      = 6         ;
            env.tau_so1     = 43        ;
            env.tau_so2     = 0.2       ;
            env.tau_si1     = 2.8723    ;
            env.tau_si2     = 2.8723    ;
            env.tau_winf    = 0.07      ;
            env.theta_v     = 0.3       ;
            env.theta_p_v   = 0.3       ;
            env.theta_m_v   = 0.015     ;
            env.theta_vinf  = 0.015     ;
            env.theta_w     = 0.015     ;
            env.theta_winf  = 0.006     ;
            env.theta_so    = 0.015     ;
            env.theta_si    = 0.015     ;
            env.theta_p_si  = 1         ;
            env.theta_si_c  = 1         ;
            env.theta_s     = 0.015     ;
            env.theta_o     = 0.006     ;
            env.k_m_w       = 65        ;
            env.k_p_w       = 65        ;
            env.k_s         = 2.0994    ;
            env.k_so        = 2         ;
            env.k_si        = 1         ;
            env.k_si1       = 1         ;
            env.k_si2       = 1         ;
            env.k_si_c      = 1         ;
            env.u_m_w       = 0.03      ;
            env.u_s         = 0.9087    ;
            env.u_o         = 0         ;
            env.u_u         = 1.58      ;
            env.u_so        = 0.65      ;
            env.w_sinf      = 0.94      ;
            env.w_p_c       = 0         ;
            env.s_c         = 0         ;
            env.alpha_w     = 1         ;
            env.alpha_si    = 1         ;
            env.beta_v      = 0         ;
            env.gamma_si    = 1         ;
            env.delta_w     = 1.0       ;
            env.u_p_w       = 1.0       ;

            break ;

        case 'Atrial-P1':
            env.tau_m_v1    = 57.12      ;
            env.tau_m_v2    = 1012       ;
            env.tau_p_v     = 2.189      ;
            env.tau_m_w1    = 68.50      ;
            env.tau_m_w2    = 68.50      ;
            env.tau_p_w1    = 871.4      ;
            env.tau_p_w2    = 871.4      ;
            env.tau_s1      = 1.7570     ;
            env.tau_s2      = 1.110      ;
            env.tau_fi      = 0.12990    ;
            env.tau_o1      = 15.17      ;
            env.tau_o2      = 15.17      ;
            env.tau_so1     = 72.66      ;
            env.tau_so2     = 7.933      ;
            env.tau_si1     = 40.11      ;
            env.tau_si2     = 40.11      ;
            env.tau_winf    = 1.         ;
            env.theta_v     = 0.23       ;
            env.theta_p_v   = 0.23       ;
            env.theta_m_v   = 0.3085     ;
            env.theta_vinf  = 2.         ;
            env.theta_w     = 0.2635     ;
            env.theta_winf  = -1.        ;
            env.theta_so    = 0.1313     ;
            env.theta_si    = -1.        ;
            env.theta_p_si  = 0.         ;
            env.theta_si_c  = 0.         ;
            env.theta_s     = 0.05766    ;
            env.theta_o     = 0.         ;
            env.k_m_w       = 0.         ;
            env.k_p_w       = 0.         ;
            env.k_s         = 6.043      ;
            env.k_so        = 2.592      ;
            env.k_si        = 0.         ;
            env.k_si1       = 0.         ;
            env.k_si2       = 0.         ;
            env.k_si_c      = 0.         ;
            env.u_m_w       = 0.         ;
            env.u_s         = 0.1995     ;
            env.u_o         = 0.         ;
            env.u_u         = 1.         ;
            env.u_so        = 0.4804     ;
            env.w_sinf      = 1.         ;
            env.w_p_c       = 1.         ;
            env.s_c         = 0.         ;
            env.alpha_w     = 1.         ;
            env.alpha_si    = 1.         ;
            env.beta_v      = 0.         ;
            env.gamma_si    = 1.         ;
            env.delta_w     = 1.0        ;
            env.u_p_w       = 1.0        ;

            break ;
        case 'Atrial-P1-Alt':
            env.tau_m_v1    = 46.77      ;
            env.tau_m_v2    = 1321       ;
            env.tau_p_v     = 1.759      ;
            env.tau_m_w1    = 80.18      ;
            env.tau_m_w2    = 80.18      ;
            env.tau_p_w1    = 749.5      ;
            env.tau_p_w2    = 749.5      ;
            env.tau_s1      = 1.983      ;
            env.tau_s2      = 1.484      ;
            env.tau_fi      = 0.08673    ;
            env.tau_o1      = 17.05      ;
            env.tau_o2      = 17.05      ;
            env.tau_so1     = 54.90      ;
            env.tau_so2     = 1.685      ;
            env.tau_si1     = 38.82      ;
            env.tau_si2     = 38.82      ;
            env.tau_winf    = 1.         ;
            env.theta_v     = 0.23       ;
            env.theta_p_v   = 0.23       ;
            env.theta_m_v   = 0.1142     ;
            env.theta_vinf  = 2.         ;
            env.theta_w     = 0.2508     ;
            env.theta_winf  = -1.        ;
            env.theta_so    = 0.2171     ;
            env.theta_si    = -1.        ;
            env.theta_p_si  = 0.         ;
            env.theta_si_c  = 0.         ;
            env.theta_s     = 0.1428     ;
            env.theta_o     = 0.         ;
            env.k_m_w       = 0.         ;
            env.k_p_w       = 0.         ;
            env.k_s         = 21.62      ;
            env.k_so        = 2.161      ;
            env.k_si        = 0.         ;
            env.k_si1       = 0.         ;
            env.k_si2       = 0.         ;
            env.k_si_c      = 0.         ;
            env.u_m_w       = 0.         ;
            env.u_s         = 0.2168     ;
            env.u_o         = 0.         ;
            env.u_u         = 1.         ;
            env.u_so        = 0.6520     ;
            env.w_sinf      = 1.         ;
            env.w_p_c       = 1.         ;
            env.s_c         = 0.         ;
            env.alpha_w     = 1.         ;
            env.alpha_si    = 1.         ;
            env.beta_v      = 0.         ;
            env.gamma_si    = 1.         ;
            env.delta_w     = 1.0        ;
            env.u_p_w       = 1.0        ;

            break ;

        case 'Atrial-P2':
            env.tau_m_v1    = 40.31      ;
            env.tau_m_v2    = 1183       ;
            env.tau_p_v     = 1.349      ;
            env.tau_m_w1    = 89.08      ;
            env.tau_m_w2    = 89.08      ;
            env.tau_p_w1    = 777.0      ;
            env.tau_p_w2    = 777.0      ;
            env.tau_s1      = 1.086      ;
            env.tau_s2      = 1.144      ;
            env.tau_fi      = 0.04456    ;
            env.tau_o1      = 23.45      ;
            env.tau_o2      = 23.45      ;
            env.tau_so1     = 97.89      ;
            env.tau_so2     = 3.308      ;
            env.tau_si1     = 36.60      ;
            env.tau_si2     = 36.60      ;
            env.tau_winf    = 1.         ;
            env.theta_v     = 0.23       ;
            env.theta_p_v   = 0.23       ;
            env.theta_m_v   = 0.1799     ;
            env.theta_vinf  = 2.         ;
            env.theta_w     = 0.2566     ;
            env.theta_winf  = -1.        ;
            env.theta_so    = 0.2579     ;
            env.theta_si    = -1.        ;
            env.theta_p_si  = 0.         ;
            env.theta_si_c  = 0.         ;
            env.theta_s     = 0.1943     ;
            env.theta_o     = 0.         ;
            env.k_m_w       = 0.         ;
            env.k_p_w       = 0.         ;
            env.k_s         = 6.142      ;
            env.k_so        = 1.997      ;
            env.k_si        = 0.         ;
            env.k_si1       = 0.         ;
            env.k_si2       = 0.         ;
            env.k_si_c      = 0.         ;
            env.u_m_w       = 0.         ;
            env.u_s         = 0.2722     ;
            env.u_o         = 0.         ;
            env.u_u         = 1.         ;
            env.u_so        = 0.4185     ;
            env.w_sinf      = 1.         ;
            env.w_p_c       = 1.         ;
            env.s_c         = 0.         ;
            env.alpha_w     = 1.         ;
            env.alpha_si    = 1.         ;
            env.beta_v      = 0.         ;
            env.gamma_si    = 1.         ;
            env.delta_w     = 1.0        ;
            env.u_p_w       = 1.0        ;

            break ;

        case 'Atrial-P3':
            env.tau_m_v1    = 35.75   ;
            env.tau_m_v2    = 1187    ;
            env.tau_p_v     = 1.247   ;
            env.tau_m_w1    = 109.8   ;
            env.tau_m_w2    = 109.8   ;
            env.tau_p_w1    = 751.8   ;
            env.tau_p_w2    = 751.8   ;
            env.tau_s1      = 2.241   ;
            env.tau_s2      = 1.487   ;
            env.tau_fi      = 0.0688  ;
            env.tau_o1      = 18.31   ;
            env.tau_o2      = 18.31   ;
            env.tau_so1     = 54.43   ;
            env.tau_so2     = 4.894   ;
            env.tau_si1     = 40.39   ;
            env.tau_si2     = 40.39   ;
            env.tau_winf    = 1.      ;
            env.theta_v     = 0.23    ;
            env.theta_p_v   = 0.23    ;
            env.theta_m_v   = 0.1107  ;
            env.theta_vinf  = 2.      ;
            env.theta_w     = 0.2798  ;
            env.theta_winf  = -1.     ;
            env.theta_so    = 0.2131  ;
            env.theta_si    = -1.     ;
            env.theta_p_si  = 0.      ;
            env.theta_si_c  = 0.      ;
            env.theta_s     = 0.1601  ;
            env.theta_o     = 0.      ;
            env.k_m_w       = 0.      ;
            env.k_p_w       = 0.      ;
            env.k_s         = 8.679   ;
            env.k_so        = 2.187   ;
            env.k_si        = 0.      ;
            env.k_si1       = 0.      ;
            env.k_si2       = 0.      ;
            env.k_si_c      = 0.      ;
            env.u_m_w       = 0.      ;
            env.u_s         = 0.2097  ;
            env.u_o         = 0.      ;
            env.u_u         = 1.      ;
            env.u_so        = 0.6804  ;
            env.w_sinf      = 1.      ;
            env.w_p_c       = 1.      ;
            env.s_c         = 0.      ;
            env.alpha_w     = 1.      ;
            env.alpha_si    = 1.      ;
            env.beta_v      = 0.      ;
            env.gamma_si    = 1.      ;
            env.delta_w     = 1.0     ;
            env.u_p_w       = 1.0     ;

            break ;

        case 'Atrial-P4':
            env.tau_m_v1    = 971.3      ;
            env.tau_m_v2    = 120.5      ;
            env.tau_p_v     = 2.243      ;
            env.tau_m_w1    = 110.7      ;
            env.tau_m_w2    = 110.7      ;
            env.tau_p_w1    = 616.0      ;
            env.tau_p_w2    = 616.0      ;
            env.tau_s1      = 7.104E-03  ;
            env.tau_s2      = 16.29      ;
            env.tau_fi      = 0.08511    ;
            env.tau_o1      = 6.754      ;
            env.tau_o2      = 6.754      ;
            env.tau_so1     = 152.9      ;
            env.tau_so2     = 19.82      ;
            env.tau_si1     = 18.94      ;
            env.tau_si2     = 18.94      ;
            env.tau_winf    = 1.         ;
            env.theta_v     = 0.23       ;
            env.theta_p_v   = 0.23       ;
            env.theta_m_v   = 0.03489    ;
            env.theta_vinf  = 2.         ;
            env.theta_w     = 0.1788     ;
            env.theta_winf  = -1.        ;
            env.theta_so    = 0.2069     ;
            env.theta_si    = -1.        ;
            env.theta_p_si  = 0.         ;
            env.theta_si_c  = 0.         ;
            env.theta_s     = 3.140E-04  ;
            env.theta_o     = 0.         ;
            env.k_m_w       = 0.         ;
            env.k_p_w       = 0.         ;
            env.k_s         = 8.958      ;
            env.k_so        = 8.677      ;
            env.k_si        = 0.         ;
            env.k_si1       = 0.         ;
            env.k_si2       = 0.         ;
            env.k_si_c      = 0.         ;
            env.u_m_w       = 0.         ;
            env.u_s         = 0.1682     ;
            env.u_o         = 0.         ;
            env.u_u         = 1.         ;
            env.u_so        = 6.013E-03  ;
            env.w_sinf      = 1.         ;
            env.w_p_c       = 1.         ;
            env.s_c         = 0.         ;
            env.alpha_w     = 1.         ;
            env.alpha_si    = 1.         ;
            env.beta_v      = 0.         ;
            env.gamma_si    = 1.         ;
            env.delta_w     = 1.0        ;
            env.u_p_w       = 1.0        ;

            break ;

        case 'Atrial-P5':
            env.tau_m_v1    = 45.15    ;
            env.tau_m_v2    = 1166     ;
            env.tau_p_v     = 2.194    ;
            env.tau_m_w1    = 166.4    ;
            env.tau_m_w2    = 166.4    ;
            env.tau_p_w1    = 836.3    ;
            env.tau_p_w2    = 836.3    ;
            env.tau_s1      = 0.764    ;
            env.tau_s2      = 1.315    ;
            env.tau_fi      = 0.06711  ;
            env.tau_o1      = 18.28    ;
            env.tau_o2      = 18.28    ;
            env.tau_so1     = 105.4    ;
            env.tau_so2     = 3.264    ;
            env.tau_si1     = 39.23    ;
            env.tau_si2     = 39.23    ;
            env.tau_winf    = 1.       ;
            env.theta_v     = 0.23     ;
            env.theta_p_v   = 0.23     ;
            env.theta_m_v   = 0.1382   ;
            env.theta_vinf  = 2.       ;
            env.theta_w     = 0.2589   ;
            env.theta_winf  = -1.      ;
            env.theta_so    = 0.2588   ;
            env.theta_si    = -1.      ;
            env.theta_p_si  = 0.       ;
            env.theta_si_c  = 0.       ;
            env.theta_s     = 0.1797   ;
            env.theta_o     = 0.       ;
            env.k_m_w       = 0.       ;
            env.k_p_w       = 0.       ;
            env.k_s         = 7.351    ;
            env.k_so        = 1.968    ;
            env.k_si        = 0.       ;
            env.k_si1       = 0.       ;
            env.k_si2       = 0.       ;
            env.k_si_c      = 0.       ;
            env.u_m_w       = 0.       ;
            env.u_s         = 0.2023   ;
            env.u_o         = 0.       ;
            env.u_u         = 1.       ;
            env.u_so        = 0.3497   ;
            env.w_sinf      = 1.       ;
            env.w_p_c       = 1.       ;
            env.s_c         = 0.       ;
            env.alpha_w     = 1.       ;
            env.alpha_si    = 1.       ;
            env.beta_v      = 0.       ;
            env.gamma_si    = 1.       ;
            env.delta_w     = 1.0      ;
            env.u_p_w       = 1.0      ;

            break ;

        case 'Atrial-Original':
            env.tau_m_v1    = 19.60    ;
            env.tau_m_v2    = 1250     ;
            env.tau_p_v     = 3.330    ;
            env.tau_m_w1    = 41.00    ;
            env.tau_m_w2    = 41.00    ;
            env.tau_p_w1    = 870.0    ;
            env.tau_p_w2    = 870.0    ;
            env.tau_s1      = 1.000    ;
            env.tau_s2      = 1.000    ;
            env.tau_fi      = 0.2500   ;
            env.tau_o1      = 12.50    ;
            env.tau_o2      = 12.50    ;
            env.tau_so1     = 33.30    ;
            env.tau_so2     = 33.30    ;
            env.tau_si1     = 29.00    ;
            env.tau_si2     = 29.00    ;
            env.tau_winf    = 1.       ;
            env.theta_v     = 0.23     ;
            env.theta_p_v   = 0.23     ;
            env.theta_m_v   = 0.04000  ;
            env.theta_vinf  = 2.       ;
            env.theta_w     = 0.1300   ;
            env.theta_winf  = -1.      ;
            env.theta_so    = 0.1300   ;
            env.theta_si    = -1.      ;
            env.theta_p_si  = 0.       ;
            env.theta_si_c  = 0.       ;
            env.theta_s     = 0.1300   ;
            env.theta_o     = 0.       ;
            env.k_m_w       = 0.       ;
            env.k_p_w       = 0.       ;
            env.k_s         = 10.00    ;
            env.k_so        = 10.00    ;
            env.k_si        = 0.       ;
            env.k_si1       = 0.       ;
            env.k_si2       = 0.       ;
            env.k_si_c      = 0.       ;
            env.u_m_w       = 0.       ;
            env.u_s         = 0.8500   ;
            env.u_o         = 0.       ;
            env.u_u         = 1.       ;
            env.u_so        = 0.8500   ;
            env.w_sinf      = 1.       ;
            env.w_p_c       = 1.       ;
            env.s_c         = 0.       ;
            env.alpha_w     = 1.       ;
            env.alpha_si    = 1.       ;
            env.beta_v      = 0.       ;
            env.gamma_si    = 1.       ;
            env.delta_w     = 1.0      ;
            env.u_p_w       = 1.0      ;

            break ;

        case 'Rabbit-CytoD':
            env.tau_m_v1    = 15.2     ;
            env.tau_m_v2    = 100.     ;
            env.tau_p_v     = 3.33     ;
            env.tau_m_w1    = 55.0     ;
            env.tau_m_w2    = 55.0     ;
            env.tau_p_w1    = 382.     ;
            env.tau_p_w2    = 382.     ;
            env.tau_s1      = 1.       ;
            env.tau_s2      = 1.       ;
            env.tau_fi      = .075     ;
            env.tau_o1      = 8.3      ;
            env.tau_o2      = 8.3      ;
            env.tau_so1     = 50.5     ;
            env.tau_so2     = 50.5     ;
            env.tau_si1     = 1.       ;
            env.tau_si2     = 1.       ;
            env.tau_winf    = 1.       ;
            env.theta_v     = .25      ;
            env.theta_p_v   = .25      ;
            env.theta_m_v   = .05      ;
            env.theta_vinf  = 2.       ;
            env.theta_w     = .25      ;
            env.theta_winf  = -1.      ;
            env.theta_so    = .25      ;
            env.theta_si    = 0.       ;
            env.theta_p_si  = 0.       ;
            env.theta_si_c  = .4       ;
            env.theta_s     = 0.       ;
            env.theta_o     = 0.       ;
            env.k_m_w       = 0.       ;
            env.k_p_w       = 0.       ;
            env.k_s         = 0.       ;
            env.k_so        = 0.       ;
            env.k_si        = 0.       ;
            env.k_si1       = 0.       ;
            env.k_si2       = 0.       ;
            env.k_si_c      = 10.      ;
            env.u_m_w       = 0.       ;
            env.u_s         = 0.       ;
            env.u_o         = 0.       ;
            env.u_u         = 1.0      ;
            env.u_so        = 0.       ;
            env.w_sinf      = 1.       ;
            env.w_p_c       = 0.       ;
            env.s_c         = 0.       ;
            env.alpha_w     = 1.       ;
            env.alpha_si    = 45.      ;
            env.beta_v      = 0.       ;
            env.gamma_si    = 0.       ;
            env.delta_w     = 1.0      ;
            env.u_p_w       = 1.0      ;

            break ;

        case 'Rabbit-Dam':
            env.tau_m_v1    = 28.0     ;
            env.tau_m_v2    = 100.     ;
            env.tau_p_v     = 3.33     ;
            env.tau_m_w1    = 98.      ;
            env.tau_m_w2    = 98.      ;
            env.tau_p_w1    = 615.     ;
            env.tau_p_w2    = 615.     ;
            env.tau_s1      = 1.       ;
            env.tau_s2      = 1.       ;
            env.tau_fi      = .0942    ;
            env.tau_o1      = 8.3      ;
            env.tau_o2      = 8.3      ;
            env.tau_so1     = 50.5     ;
            env.tau_so2     = 50.5     ;
            env.tau_si1     = 1.       ;
            env.tau_si2     = 1.       ;
            env.tau_winf    = 1.       ;
            env.theta_v     = .25      ;
            env.theta_p_v   = .25      ;
            env.theta_m_v   = .05      ;
            env.theta_vinf  = 2.       ;
            env.theta_w     = .25      ;
            env.theta_winf  = -1.      ;
            env.theta_so    = .25      ;
            env.theta_si    = 0.       ;
            env.theta_p_si  = 0.       ;
            env.theta_si_c  = .7       ;
            env.theta_s     = 0.       ;
            env.theta_o     = 0.       ;
            env.k_m_w       = 0.       ;
            env.k_p_w       = 0.       ;
            env.k_s         = 0.       ;
            env.k_so        = 0.       ;
            env.k_si        = 0.       ;
            env.k_si1       = 0.       ;
            env.k_si2       = 0.       ;
            env.k_si_c      = 10.      ;
            env.u_m_w       = 0.       ;
            env.u_s         = 0.       ;
            env.u_o         = 0.       ;
            env.u_u         = 1.       ;
            env.u_so        = 0.       ;
            env.w_sinf      = 1.       ;
            env.w_p_c       = 0.       ;
            env.s_c         = 0.       ;
            env.alpha_w     = 1.       ;
            env.alpha_si    = 48.      ;
            env.beta_v      = 0.       ;
            env.gamma_si    = 0.       ;
            env.delta_w     = 1.0      ;
            env.u_p_w       = 1.0      ;

            break ;

        case 'Pig-Ventricle':
            env.tau_m_v1    = 40.0     ;
            env.tau_m_v2    = 2000.0   ;
            env.tau_p_v     = 10.0     ;
            env.tau_m_w1    = 305.0    ;
            env.tau_m_w2    = 305.0    ;
            env.tau_p_w1    = 320.0    ;
            env.tau_p_w2    = 320.0    ;
            env.tau_s1      = 1.0      ;
            env.tau_s2      = 1.0      ;
            env.tau_fi      = 0.175    ;
            env.tau_o1      = 4.5      ;
            env.tau_o2      = 4.5      ;
            env.tau_so1     = 35.0     ;
            env.tau_so2     = 5.0      ;
            env.tau_si1     = 1.0      ;
            env.tau_si2     = 1.0      ;
            env.tau_winf    = 1.0      ;
            env.theta_v     = 0.25     ;
            env.theta_p_v   = 0.1      ;
            env.theta_m_v   = 0.0025   ;
            env.theta_vinf  = 2.00     ;
            env.theta_w     = 0.25     ;
            env.theta_winf  = -1.0     ;
            env.theta_so    = 0.25     ;
            env.theta_si    = 2.0      ;
            env.theta_p_si  = 0.9      ;
            env.theta_si_c  = 0.35     ;
            env.theta_s     = 0.0      ;
            env.theta_o     = 0.0      ;
            env.k_m_w       = 0.0      ;
            env.k_p_w       = 0.0      ;
            env.k_s         = 0.0      ;
            env.k_so        = 50.0     ;
            env.k_si        = 0.0      ;
            env.k_si1       = 4.5      ;
            env.k_si2       = 10.0     ;
            env.k_si_c      = 7.0      ;
            env.u_m_w       = 0.0      ;
            env.u_s         = 0.0      ;
            env.u_o         = 0.0      ;
            env.u_u         = 0.97     ;
            env.u_so        = 0.85     ;
            env.w_sinf      = 1.0      ;
            env.w_p_c       = 0.0      ;
            env.s_c         = 0.0      ;
            env.alpha_w     = 4.0      ;
            env.alpha_si    = 62.0     ;
            env.beta_v      = 1.0      ;
            env.gamma_si    = 0.0      ;
            env.delta_w     = 1.0      ;
            env.u_p_w       = 1.0      ;

            break ;

        case 'Canine-Epi_37':
            env.tau_m_v1    = 20       ;
            env.tau_m_v2    = 1150     ;
            env.tau_p_v     = 1.4506   ;
            env.tau_m_w1    = 120      ;
            env.tau_m_w2    = 300      ;
            env.tau_p_w1    = 120      ;
            env.tau_p_w2    = 140      ;
            env.tau_s1      = 2.7342   ;
            env.tau_s2      = 16       ;
            env.tau_fi      = 0.11     ;
            env.tau_o1      = 400      ;
            env.tau_o2      = 6        ;
            env.tau_so1     = 30.0181  ;
            env.tau_so2     = 0.9957   ;
            env.tau_si1     = 1.8875   ;
            env.tau_si2     = 1.8875   ;
            env.tau_winf    = 0.07     ;
            env.theta_v     = 0.3      ;
            env.theta_p_v   = 0.3      ;
            env.theta_m_v   = 0.006    ;
            env.theta_vinf  = 0.006    ;
            env.theta_w     = 0.13     ;
            env.theta_winf  = 0.006    ;
            env.theta_so    = 0.13     ;
            env.theta_si    = 0.13     ;
            env.theta_p_si  = 0        ;
            env.theta_si_c  = 0        ;
            env.theta_s     = 0.13     ;
            env.theta_o     = 0.006    ;
            env.k_m_w       = 65       ;
            env.k_p_w       = 5.7      ;
            env.k_s         = 2.0994   ;
            env.k_so        = 2.0458   ;
            env.k_si        = 0        ;
            env.k_si1       = 0        ;
            env.k_si2       = 0        ;
            env.k_si_c      = 0        ;
            env.u_m_w       = 0.03     ;
            env.u_s         = 0.9087   ;
            env.u_o         = 0        ;
            env.u_u         = 1.55     ;
            env.u_so        = 0.65     ;
            env.w_sinf      = 0.94     ;
            env.w_p_c       = 0        ;
            env.s_c         = 0        ;
            env.alpha_w     = 1        ;
            env.alpha_si    = 1        ;
            env.beta_v      = 0        ;
            env.gamma_si    = 1        ;
            env.delta_w     = 0        ;
            env.u_p_w       = 0.15     ;

            break ;
        case 'Canine-Endo_37':
            env.tau_m_v1    = 55       ;
            env.tau_m_v2    = 40       ;
            env.tau_p_v     = 1.4506   ;
            env.tau_m_w1    = 40       ;
            env.tau_m_w2    = 115      ;
            env.tau_p_w1    = 175      ;
            env.tau_p_w2    = 230      ;
            env.tau_s1      = 2.7342   ;
            env.tau_s2      = 2        ;
            env.tau_fi      = 0.10     ;
            env.tau_o1      = 470      ;
            env.tau_o2      = 6        ;
            env.tau_so1     = 40       ;
            env.tau_so2     = 1.2      ;
            env.tau_si1     = 2.9013   ;
            env.tau_si2     = 2.9013   ;
            env.tau_winf    = 0.0273   ;
            env.theta_v     = 0.3      ;
            env.theta_p_v   = 0.3      ;
            env.theta_m_v   = 0.2      ;
            env.theta_vinf  = 0.2      ;
            env.theta_w     = 0.13     ;
            env.theta_winf  = 0.006    ;
            env.theta_so    = 0.13     ;
            env.theta_si    = 0.13     ;
            env.theta_p_si  = 0        ;
            env.theta_si_c  = 0        ;
            env.theta_s     = 0.13     ;
            env.theta_o     = 0.006    ;
            env.k_m_w       = 20       ;
            env.k_p_w       = 8        ;
            env.k_s         = 2.0994   ;
            env.k_so        = 2        ;
            env.k_si        = 0        ;
            env.k_si1       = 0        ;
            env.k_si2       = 0        ;
            env.k_si_c      = 0        ;
            env.u_m_w       = 0.00615  ;
            env.u_s         = 0.9087   ;
            env.u_o         = 0        ;
            env.u_u         = 1.56     ;
            env.u_so        = 0.65     ;
            env.w_sinf      = 0.78     ;
            env.w_p_c       = 0        ;
            env.s_c         = 0        ;
            env.alpha_w     = 1        ;
            env.alpha_si    = 1        ;
            env.beta_v      = 0        ;
            env.gamma_si    = 1        ;
            env.delta_w     = 0        ;
            env.u_p_w       = 0.0005   ;

            break ;

        case 'Canine-Epi_26':
            env.tau_m_v1    = 10       ;
            env.tau_m_v2    = 1150     ;
            env.tau_p_v     = 1.4506   ;
            env.tau_m_w1    = 75       ;
            env.tau_m_w2    = 90       ;
            env.tau_p_w1    = 90       ;
            env.tau_p_w2    = 140      ;
            env.tau_s1      = 2.7342   ;
            env.tau_s2      = 16       ;
            env.tau_fi      = 0.11     ;
            env.tau_o1      = 400      ;
            env.tau_o2      = 6        ;
            env.tau_so1     = 30.0181  ;
            env.tau_so2     = 0.9957   ;
            env.tau_si1     = 1.8875   ;
            env.tau_si2     = 1.8875   ;
            env.tau_winf    = 0.07     ;
            env.theta_v     = 0.3      ;
            env.theta_p_v   = 0.3      ;
            env.theta_m_v   = 0.006    ;
            env.theta_vinf  = 0.006    ;
            env.theta_w     = 0.13     ;
            env.theta_winf  = 0.006    ;
            env.theta_so    = 0.13     ;
            env.theta_si    = 0.13     ;
            env.theta_p_si  = 0        ;
            env.theta_si_c  = 0        ;
            env.theta_s     = 0.13     ;
            env.theta_o     = 0.006    ;
            env.k_m_w       = 65       ;
            env.k_p_w       = 6.5      ;
            env.k_s         = 2.0994   ;
            env.k_so        = 2.0458   ;
            env.k_si        = 0        ;
            env.k_si1       = 0        ;
            env.k_si2       = 0        ;
            env.k_si_c      = 0        ;
            env.u_m_w       = 0.02     ;
            env.u_s         = 0.9087   ;
            env.u_o         = 0        ;
            env.u_u         = 1.55     ;
            env.u_so        = 0.65     ;
            env.w_sinf      = 0.94     ;
            env.w_p_c       = 0        ;
            env.s_c         = 0        ;
            env.alpha_w     = 1        ;
            env.alpha_si    = 1        ;
            env.beta_v      = 0        ;
            env.gamma_si    = 1        ;
            env.delta_w     = 0        ;
            env.u_p_w       = 0.8      ;

            break ;
        case 'Canine-Endo_26':
            env.tau_m_v1    = 15       ;
            env.tau_m_v2    = 40       ;
            env.tau_p_v     = 1.4506   ;
            env.tau_m_w1    = 40       ;
            env.tau_m_w2    = 165      ;
            env.tau_p_w1    = 175      ;
            env.tau_p_w2    = 150      ;
            env.tau_s1      = 2.7342   ;
            env.tau_s2      = 2        ;
            env.tau_fi      = 0.10     ;
            env.tau_o1      = 470      ;
            env.tau_o2      = 6        ;
            env.tau_so1     = 40       ;
            env.tau_so2     = 1.2      ;
            env.tau_si1     = 2.9013   ;
            env.tau_si2     = 2.9013   ;
            env.tau_winf    = 0.0273   ;
            env.theta_v     = 0.3      ;
            env.theta_p_v   = 0.3      ;
            env.theta_m_v   = 0.2      ;
            env.theta_vinf  = 0.2      ;
            env.theta_w     = 0.13     ;
            env.theta_winf  = 0.006    ;
            env.theta_so    = 0.13     ;
            env.theta_si    = 0.13     ;
            env.theta_p_si  = 0        ;
            env.theta_si_c  = 0        ;
            env.theta_s     = 0.13     ;
            env.theta_o     = 0.006    ;
            env.k_m_w       = 8000     ;
            env.k_p_w       = 8        ;
            env.k_s         = 2.0994   ;
            env.k_so        = 2        ;
            env.k_si        = 0        ;
            env.k_si1       = 0        ;
            env.k_si2       = 0        ;
            env.k_si_c      = 0        ;
            env.u_m_w       = 0.005    ;
            env.u_s         = 0.9087   ;
            env.u_o         = 0        ;
            env.u_u         = 1.56     ;
            env.u_so        = 0.65     ;
            env.w_sinf      = 0.78     ;
            env.w_p_c       = 0        ;
            env.s_c         = 0        ;
            env.alpha_w     = 1        ;
            env.alpha_si    = 1        ;
            env.beta_v      = 0        ;
            env.gamma_si    = 1        ;
            env.delta_w     = 0        ;
            env.u_p_w       = 0.0005   ;

            break ;
        
    } /* End of switch */

    var paramList =  [   
                        'tau_m_v1'      ,   
                        'tau_m_v2'      ,   
                        'tau_p_v'       ,   
                        'tau_m_w1'      ,   
                        'tau_m_w2'      ,   
                        'tau_p_w1'      ,   
                        'tau_p_w2'      ,   
                        'tau_s1'        ,   
                        'tau_s2'        ,   
                        'tau_fi'        ,   
                        'tau_o1'        ,   
                        'tau_o2'        ,   
                        'tau_so1'       ,   
                        'tau_so2'       ,   
                        'tau_si1'       ,   
                        'tau_si2'       ,   
                        'tau_winf'      ,   
                        'theta_v'       ,   
                        'theta_p_v'     ,   
                        'theta_m_v'     ,   
                        'theta_vinf'    ,   
                        'theta_w'       ,   
                        'theta_winf'    ,   
                        'theta_so'      ,   
                        'theta_si'      ,   
                        'theta_p_si'    ,   
                        'theta_si_c'    ,   
                        'theta_s'       ,   
                        'theta_o'       ,   
                        'k_m_w'         ,   
                        'k_p_w'         ,   
                        'k_s'           ,   
                        'k_so'          ,   
                        'k_si'          ,   
                        'k_si1'         ,   
                        'k_si2'         ,   
                        'k_si_c'        ,   
                        'u_m_w'         ,   
                        'u_s'           ,   
                        'u_o'           ,   
                        'u_u'           ,    
                        'u_so'          ,    
                        'w_sinf'        ,    
                        'w_p_c'         ,    
                        's_c'           ,    
                        'alpha_w'       ,    
                        'alpha_si'      ,    
                        'beta_v'        ,    
                        'gamma_si'      ,
                        'delta_w'       ,
                        'u_p_w'         ,
                     ] ;

    Abubu.setUniformsInSolvers( paramList, [
        env.tau_m_v1   , 
        env.tau_m_v2   , 
        env.tau_p_v    , 
        env.tau_m_w1   , 
        env.tau_m_w2   , 
        env.tau_p_w1   , 
        env.tau_p_w2   , 
        env.tau_s1     , 
        env.tau_s2     , 
        env.tau_fi     , 
        env.tau_o1     , 
        env.tau_o2     , 
        env.tau_so1    , 
        env.tau_so2    , 
        env.tau_si1    , 
        env.tau_si2    , 
        env.tau_winf   , 
        env.theta_v    , 
        env.theta_p_v  , 
        env.theta_m_v  , 
        env.theta_vinf , 
        env.theta_w    , 
        env.theta_winf , 
        env.theta_so   , 
        env.theta_si   , 
        env.theta_p_si , 
        env.theta_si_c , 
        env.theta_s    , 
        env.theta_o    , 
        env.k_m_w      , 
        env.k_p_w      , 
        env.k_s        , 
        env.k_so       , 
        env.k_si       , 
        env.k_si1      , 
        env.k_si2      , 
        env.k_si_c     , 
        env.u_m_w      , 
        env.u_s        , 
        env.u_o        , 
        env.u_u        , 
        env.u_so       , 
        env.w_sinf     , 
        env.w_p_c      , 
        env.s_c        , 
        env.alpha_w    , 
        env.alpha_si   , 
        env.beta_v     , 
        env.gamma_si   , 
        env.delta_w    , 
        env.u_p_w      , 
    ] , [env.comp1, env.comp2 ] ) ; 
    for(var i=0; i<gui.mdlPrmFldr.__controllers.length;i++){
        gui.mdlPrmFldr.__controllers[i].updateDisplay() ;
    }


}
/*========================================================================
 * Environment
 *========================================================================
 */
function Environment(){
    this.running = false ;

    /* Model Parameters         */
    this.C_m        = 1.0 ;
    this.diffCoef   = 0.001 ;

    this.minVlt     = -90 ;
    this.maxVlt     = 30 ;

    this.paramType   = 'Pig-Ventricle' ;
    
    this.tau_m_v1    = 40.0     ;
    this.tau_m_v2    = 2000.0   ;
    this.tau_p_v     = 10.0     ;
    this.tau_m_w1    = 305.0    ;
    this.tau_m_w2    = 305.0    ;
    this.tau_p_w1    = 320.0    ;
    this.tau_p_w2    = 320.0    ;
    this.tau_s1      = 1.0      ;
    this.tau_s2      = 1.0      ;
    this.tau_fi      = 0.175    ;
    this.tau_o1      = 4.5      ;
    this.tau_o2      = 4.5      ;
    this.tau_so1     = 35.0     ;
    this.tau_so2     = 5.0      ;
    this.tau_si1     = 1.0      ;
    this.tau_si2     = 1.0      ;
    this.tau_winf    = 1.0      ;
    this.theta_v     = 0.25     ;
    this.theta_p_v   = 0.1      ;
    this.theta_m_v   = 0.0025   ;
    this.theta_vinf  = 2.00     ;
    this.theta_w     = 0.25     ;
    this.theta_winf  = -1.0     ;
    this.theta_so    = 0.25     ;
    this.theta_si    = 2.0      ;
    this.theta_p_si  = 0.9      ;
    this.theta_si_c  = 0.35     ;
    this.theta_s     = 0.0      ;
    this.theta_o     = 0.0      ;
    this.k_m_w       = 0.0      ;
    this.k_p_w       = 0.0      ;
    this.k_s         = 0.0      ;
    this.k_so        = 50.0     ;
    this.k_si        = 0.0      ;
    this.k_si1       = 4.5      ;
    this.k_si2       = 10.0     ;
    this.k_si_c      = 7.0      ;
    this.u_m_w       = 0.0      ;
    this.u_s         = 0.0      ;
    this.u_o         = 0.0      ;
    this.u_u         = 0.97     ;
    this.u_so        = 0.85     ;
    this.w_sinf      = 1.0      ;
    this.w_p_c       = 0.0      ;
    this.s_c         = 0.0      ;
    this.alpha_w     = 4.0      ;
    this.alpha_si    = 62.0     ;
    this.beta_v      = 1.0      ;
    this.gamma_si    = 0.0      ;
    this.delta_w     = 1.0      ;
    this.u_p_w       = 1.0      ;

    /* Display Parameters       */
    this.colormap    =   'rainbowHotSpring';
    this.dispWidth   =   512 ;
    this.dispHeight  =   512 ;
    this.frameRate   =   24000 ;
    this.timeWindow  =   1000 ;
    this.probeVisiblity = false ;    
    this.tiptVisiblity= false ;
    this.tiptThreshold=  .5 ;
    this.tiptColor    = "#FFFFFF";

    /* Shock */
    this.Ex = 0. ;
    this.Ey = 0. ;
    this.duration = 20 ;
    this.rotation = 1. ;
    this.phaseoffset = 0.5*Math.PI;
    this.shock = function(){
        this.shocktime = this.time.valueOf();
    } ;

    /* Solver Parameters        */
    this.width       =   512 ;
    this.height      =   512 ;
    this.dt          =   1.e-2 ;
    this.cfl         =   1.0 ;
    this.ds_x        =   6 ;
    this.ds_y        =   6 ;

    /* Autopace                 */
    this.pacing      = false ;
    this.pacePeriod  = 300 ;
    this.autoPaceRadius= 0.01 ;

    /* Solve                    */
    this.solve       = function(){
        this.running = !this.running ;
        return ;
    } ;
    this.time        = 0.0 ;
    this.clicker     = 'Pace Region';

    this.autoBreakThreshold = -40 ;
    //this.bvltNow     = breakVlt ;
    this.ry          = 0.5 ;
    this.lx          = 0.5 ;
    this.autobreak   = true ;

    this.autostop    = false;
    this.autostopInterval = 300 ;

    this.savePlot2DPrefix = '' ;
    this.savePlot2D    = function(){
        this.running = false ;
        var prefix ;
        try{
            prefix = eval(env.savePlot2DPrefix) ;
        }catch(e){
            prefix = this.savePlot2DPrefix ;
        }
        Abubu.saveCanvas( 'canvas_1',
        {
            number  : this.time ,
            postfix : '_'+this.colormap ,
            prefix  : prefix,
            format  : 'png'
        } ) ;
    }

    /* Clicker                  */
    this.clickRadius     = 0.1 ;
    this.clickPosition   = [0.5,0.5] ;
    this.conductionValue = [0.,1,1,0.05] ;
    this.paceValue       = [1.,0,0,0] ;
}

/*========================================================================
 * Initialization of the GPU and Container
 *========================================================================
 */
function loadWebGL()
{
    var canvas_1 = document.getElementById("canvas_1") ;
    var canvas_2 = document.getElementById("canvas_2") ;

    canvas_1.width  = 512 ;
    canvas_1.height = 512 ;

    env = new Environment() ;
    params = env ;
/*-------------------------------------------------------------------------
 * stats
 *-------------------------------------------------------------------------
 */
    var stats       = new Stats() ;
    document.body.appendChild( stats.domElement ) ;

/*------------------------------------------------------------------------
 * defining all render targets
 *------------------------------------------------------------------------
 */
    env.fuvws   = new Abubu.Float32Texture(env.width,env.height) ;
    env.suvws   = new Abubu.Float32Texture(env.width,env.height) ;
    env.phase   = new Abubu.Float32Texture(env.width,env.height) ;
    env.lrce    = new Abubu.Float32Texture(env.width,env.height) ;
    env.udce    = new Abubu.Float32Texture(env.width,env.height) ;
	env.holes   = new Abubu.ImageTexture(holesImage) ;
/*------------------------------------------------------------------------
 *  
 *------------------------------------------------------------------------
 */
    env.phaseSolver    = new Abubu.Solver({
        fragmentShader : phaseShader ,
        uniforms: {
            holes : { type : 't', value : env.holes } ,
        } ,
        targets : {
            phase : { location :0 , target : env.phase } 
        }
    } ) ;

    env.phaseSolver.render() ;

    env.fdCoefSolver = new Abubu.Solver({
        fragmentShader : fdCoefShader,
        uniforms : {
            phaseTxt : { type : 't', value: env.phase } ,
        } ,
        targets : { 
           lrceOut : { location : 0 , target :  env.lrce } ,
           udceOut : { location : 1 , target :  env.udce } ,
        }

    } );

    env.fdCoefSolver.render() ;

/*------------------------------------------------------------------------
 * init solver to initialize all textures
 *------------------------------------------------------------------------
 */
    env.init  = new Abubu.Solver( {
       fragmentShader  : initShader.value ,
       renderTargets   : {
           outFuvws    : { location : 0, target: env.fuvws     } ,
           outSuvws    : { location : 1, target: env.suvws     } ,
       }
    } ) ;

/*------------------------------------------------------------------------
 * comp1 and comp2 solvers for time stepping
 *------------------------------------------------------------------------
 */
    env.compUniforms = function(_inUvws ){
        this.inUvws     = { type : 't',     value : _inUvws         } ;
        this.inLrce     = { type : 't',     value : env.lrce        } ;
        this.inUdce     = { type : 't',     value : env.udce        } ;

        this.tau_m_v1   = { type : 'f',     value :  env.tau_m_v1   } ;
        this.tau_m_v2   = { type : 'f',     value :  env.tau_m_v2   } ;
        this.tau_p_v    = { type : 'f',     value :  env.tau_p_v    } ;
        this.tau_m_w1   = { type : 'f',     value :  env.tau_m_w1   } ;
        this.tau_m_w2   = { type : 'f',     value :  env.tau_m_w2   } ;
        this.tau_p_w1   = { type : 'f',     value :  env.tau_p_w1   } ;
        this.tau_p_w2   = { type : 'f',     value :  env.tau_p_w2   } ;
        this.tau_s1     = { type : 'f',     value :  env.tau_s1     } ;
        this.tau_s2     = { type : 'f',     value :  env.tau_s2     } ;
        this.tau_fi     = { type : 'f',     value :  env.tau_fi     } ;
        this.tau_o1     = { type : 'f',     value :  env.tau_o1     } ;
        this.tau_o2     = { type : 'f',     value :  env.tau_o2     } ;
        this.tau_so1    = { type : 'f',     value :  env.tau_so1    } ;
        this.tau_so2    = { type : 'f',     value :  env.tau_so2    } ;
        this.tau_si1    = { type : 'f',     value :  env.tau_si1    } ;
        this.tau_si2    = { type : 'f',     value :  env.tau_si2    } ;
        this.tau_winf   = { type : 'f',     value :  env.tau_winf   } ;
        this.theta_v    = { type : 'f',     value :  env.theta_v    } ;
        this.theta_p_v  = { type : 'f',     value :  env.theta_p_v  } ;
        this.theta_m_v  = { type : 'f',     value :  env.theta_m_v  } ;
        this.theta_vinf = { type : 'f',     value :  env.theta_vinf } ;
        this.theta_w    = { type : 'f',     value :  env.theta_w    } ;
        this.theta_winf = { type : 'f',     value :  env.theta_winf } ;
        this.theta_so   = { type : 'f',     value :  env.theta_so   } ;
        this.theta_si   = { type : 'f',     value :  env.theta_si   } ;
        this.theta_p_si = { type : 'f',     value :  env.theta_p_si } ;
        this.theta_si_c = { type : 'f',     value :  env.theta_si_c } ;
        this.theta_s    = { type : 'f',     value :  env.theta_s    } ;
        this.theta_o    = { type : 'f',     value :  env.theta_o    } ;
        this.k_m_w      = { type : 'f',     value :  env.k_m_w      } ;
        this.k_p_w      = { type : 'f',     value :  env.k_p_w      } ;
        this.k_s        = { type : 'f',     value :  env.k_s        } ;
        this.k_so       = { type : 'f',     value :  env.k_so       } ;
        this.k_si       = { type : 'f',     value :  env.k_si       } ;
        this.k_si1      = { type : 'f',     value :  env.k_si1      } ;
        this.k_si2      = { type : 'f',     value :  env.k_si2      } ;
        this.k_si_c     = { type : 'f',     value :  env.k_si_c     } ;
        this.u_m_w      = { type : 'f',     value :  env.u_m_w      } ;
        this.u_s        = { type : 'f',     value :  env.u_s        } ;
        this.u_o        = { type : 'f',     value :  env.u_o        } ;
        this.u_u        = { type : 'f',     value :  env.u_u        } ;
        this.u_so       = { type : 'f',     value :  env.u_so       } ;
        this.w_sinf     = { type : 'f',     value :  env.w_sinf     } ;
        this.w_p_c      = { type : 'f',     value :  env.w_p_c      } ;
        this.s_c        = { type : 'f',     value :  env.s_c        } ;
        this.alpha_w    = { type : 'f',     value :  env.alpha_w    } ;
        this.alpha_si   = { type : 'f',     value :  env.alpha_si   } ;
        this.beta_v     = { type : 'f',     value :  env.beta_v     } ;
        this.gamma_si   = { type : 'f',     value :  env.gamma_si   } ;
        this.delta_w    = { type : 'f',     value :  env.delta_w    } ;
        this.u_p_w      = { type : 'f',     value :  env.u_p_w      } ;
        
        this.ds_x       = { type : 'f',     value : env.ds_x        } ;
        this.ds_y       = { type : 'f',     value : env.ds_y        } ;
        this.diffCoef   = { type : 'f',     value : env.diffCoef    } ;
        this.C_m        = { type : 'f',     value : env.C_m         } ;
        this.dt         = { type : 'f',     value : env.dt          } ;

        this.Ex         = { type : 'f',     value : 0.              } ;
        this.Ey         = { type : 'f',     value : 0.              } ;
    } ;

    env.compTargets = function(_outUvws){
        this.outUvws = { location : 0  , target :  _outUvws     } ;
    } ;

    env.comp1 = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        uniforms        : new env.compUniforms( env.fuvws    ) ,
        renderTargets   : new env.compTargets(  env.suvws    ) ,
    } ) ;

    env.comp2 = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        uniforms        : new env.compUniforms( env.suvws    ) ,
        renderTargets   : new env.compTargets(  env.fuvws    ) ,
    } ) ;

/*------------------------------------------------------------------------
 * click solver
 *------------------------------------------------------------------------
 */
    env.click = new Abubu.Solver( {
        fragmentShader  : clickShader.value ,
        uniforms        : {
            map             : { type: 't',  value : env.fuvws           } ,
            clickValue      : { type: 'v4', value : 
                new Float32Array(1,0,0,0)         } ,
            clickPosition   : { type: 'v2', value : env.clickPosition  } ,
            clickRadius     : { type: 'f',  value : env.clickRadius    } ,
        } ,
        renderTargets   : {
            FragColor   : { location : 0,   target : env.suvws      } ,
        } ,
        clear           : true ,
    } ) ;
    env.clickCopy = new Abubu.Copy(env.suvws, env.fuvws ) ;

/*------------------------------------------------------------------------
 * pace
 *------------------------------------------------------------------------
 */
    env.pace = new Abubu.Solver({
            fragmentShader  : paceShader.value,
            uniforms        : {
                inVcxf      : { type: 't', value : env.suvws },
                } ,
            renderTargets: {
                outVcxf : {location : 0 , target : env.fuvws }
                }
            } ) ;

/*------------------------------------------------------------------------
 * Signal Plot
 *------------------------------------------------------------------------
 */
    env.plot = new Abubu.SignalPlot( {
            noPltPoints : 2^9,
            grid        : 'on' ,
            nx          : 5 ,
            ny          : 7 ,
            xticks : { mode : 'auto', unit : 'ms', font:'11pt Arial'} ,
            yticks : { mode : 'auto', unit : '', precision : 1 } ,
            canvas      : canvas_2,
    });

    env.plot.addMessage(    'Scaled Membrane Potential at the Probe',
                        0.5,0.05,
                    {   font : "12pt Arial" ,
                        align: "center"                          } ) ;

    env.vsgn = env.plot.addSignal( env.fuvws, {
            channel : 'r',
            minValue : -0.1 ,
            maxValue : 1.4 ,
            restValue: 0,
            color : [0.5,0,0],
            visible: true,
            linewidth : 3,
            timeWindow: env.timeWindow,
            probePosition : [0.5,0.5] , } ) ;

/*------------------------------------------------------------------------
 * disp
 *------------------------------------------------------------------------
 */
    env.disp= new Abubu.Plot2D({
        target : env.suvws ,
        prevTarget : env.fuvws ,
        phase : env.phase ,
        colormap : env.colormap,
        canvas : canvas_1 ,
        minValue: -.1 ,
        maxValue: 1.1 ,
        tipt : false ,
        tiptThreshold : env.tiptThreshold ,
        probeVisible : false ,
        colorbar : true ,
        cblborder: 30 ,
        cbrborder: 30 ,
        unit : '',
    } );
    env.disp.showColorbar() ;
    env.disp.addMessage(  '4-Variable Master Model',
                        0.05,   0.05, /* Coordinate of the
                                         message ( x,y in [0-1] )   */
                        {   font: "Bold 14pt Arial",
                            style:"#ffffff",
                            align : "start"             }   ) ;
    env.disp.addMessage(  'Simulation by Abouzar Kaboudian @ CHAOS Lab',
                        0.05,   0.1,
                        {   font: "italic 10pt Arial",
                            style: "#ffffff",
                            align : "start"             }  ) ;

/*------------------------------------------------------------------------
 * initialize
 *------------------------------------------------------------------------
 */
    env.initialize = function(){
        env.time = 0 ;
        env.paceTime = 0 ;
        env.breaked = false ;
        env.init.render() ;
        env.plot.init(0) ;
        env.disp.initialize() ;
        env.shocktime = -1;
        refreshDisplay() ;
    }

/*-------------------------------------------------------------------------
 * Render the programs
 *-------------------------------------------------------------------------
 */
   env.initialize() ;

/*------------------------------------------------------------------------
 * createGui
 *------------------------------------------------------------------------
 */
   createGui() ;

/*------------------------------------------------------------------------
 * clicker
 *------------------------------------------------------------------------
 */
    canvas_1.addEventListener("click",      onClick,        false   ) ;
    canvas_1.addEventListener('mousemove',
            function(e){
                if ( e.buttons >=1 ){
                    onClick(e) ;
                }
            } , false ) ;

/*------------------------------------------------------------------------
 * rendering the program ;
 *------------------------------------------------------------------------
 */

    env.render = function(){
        if (env.running){
            for(var i=0 ; i< env.frameRate/120 ; i++){
                env.comp1.render() ;
                env.comp2.render() ;
                env.time += 2.0*env.dt ;
                env.paceTime += 2.0*env.dt ;
                stats.update();
                stats.update() ;
                env.disp.updateTipt() ;
                env.plot.update(env.time) ;

                defibshock();                

            }

           // if ((env.paceTime > 400 ) && !env.breaked){
           //     env.breaked = true ;
           //     env.paceTime = 0. ;
           //     env.pace.render() ;
           // }
            refreshDisplay();
        }
        requestAnimationFrame(env.render) ;
    }

/*------------------------------------------------------------------------
 * add environment to document
 *------------------------------------------------------------------------
 */
    document.env = env ;

/*------------------------------------------------------------------------
 * render the webgl program
 *------------------------------------------------------------------------
 */
    env.render();

}/*  End of loadWebGL  */

/*========================================================================
 * refreshDisplay
 *========================================================================
 */
function refreshDisplay(){
    env.disp.render() ;
    env.plot.render() ;
}

/*========================================================================
 * onClick
 *========================================================================
 */
function onClick(e){
    env.clickPosition[0] =
        (e.clientX-canvas_1.offsetLeft) / env.dispWidth ;
    env.clickPosition[1] =  1.0-
        (e.clientY-canvas_1.offsetTop) / env.dispWidth ;

    env.click.setUniform('clickPosition',env.clickPosition) ;

    if (    env.clickPosition[0]   >   1.0 ||
            env.clickPosition[0]   <   0.0 ||
            env.clickPosition[1]   >   1.0 ||
            env.clickPosition[1]   <   0.0 ){
        return ;
    }
    clickRender() ;
    return ;
}

/*========================================================================
 * Render and display click event
 *========================================================================
 */
function clickRender(){
    switch( env['clicker']){
    case 'Conduction Block':
        env.click.setUniform('clickValue', env.conductionValue) ;
        clickSolve() ;
        requestAnimationFrame(clickSolve) ;
        break ;
    case 'Pace Region':
        env.click.setUniform('clickValue',env.paceValue) ;
        clickSolve() ;
        requestAnimationFrame(clickSolve) ;
        break ;
   case 'Signal Loc. Picker':
        env.plot.setProbePosition( env.clickPosition ) ;
        env.disp.setProbePosition( env.clickPosition ) ;
        env.plot.init() ;
        refreshDisplay() ;
        break ;
    case 'Autopace Loc. Picker':
        ///pacePos = new THREE.Vector2(clickPos.x, env.clickPosition[1]) ;
        paceTime = 0 ;
    }
    return ;
}
/*========================================================================
 * solve click event
 *========================================================================
 */
function clickSolve(){
    env.click.render() ;
    env.clickCopy.render() ;
    refreshDisplay() ;
}

/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * End of require()
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
loadWebGL() ;
} ) ;
