import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Lock, User, Eye, ShieldCheck, LineChart, Bell, Shield } from "lucide-react";
import { Logo } from "../components/Logo";
import { FeatureItem } from "../components/FeatureItem";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext } = props;
    const { realm, url, usernameHidden, login, auth, registrationDisabled, message } = kcContext;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <div className="login-container">
            {/* Unified Background Gradient - Left Edge */}
            <div className="bg-gradient" />
            
            <LanguageSwitcher kcContext={kcContext} />

            {/* Left Panel */}
            <div className="left-panel">
                <div className="left-panel-content">
                    <div className="flex-none">
                        <Logo />
                    </div>
                    
                    <div className="flex-none mt-8">
                        <div>
                            <h1 className="title-main">
                                Anticipez. Analysez.<br />
                                <span className="title-highlight">Sécurisez.</span>
                            </h1>
                            <p className="text-muted text-sm mt-4" style={{ lineHeight: '1.6' }}>
                                KERUBISCAN vous aide à détecter, analyser et prioriser les vulnérabilités de votre infrastructure pour renforcer votre posture de sécurité.
                            </p>
                        </div>

                        <div className="feature-grid mt-8">
                            <FeatureItem icon={ShieldCheck} title="Détection avancée" description="Scannez en profondeur vos systèmes et applications." />
                            <FeatureItem icon={LineChart} title="Analyses détaillées" description="Obtenez des rapports clairs et exploitables." />
                            <FeatureItem icon={Bell} title="Alertes intelligentes" description="Soyez notifié des risques critiques en temps réel." />
                            <FeatureItem icon={Shield} title="Sécurité renforcée" description="Réduisez votre surface d'attaque efficacement." />
                        </div>
                    </div>
                    
                    {/* Graphic Area */}
                    <div className="graphic-area">
                        <img 
                            src={`${import.meta.env.BASE_URL}illus.png`}
                            alt="Kerubiscan Platform" 
                            className="graphic-img"
                            onError={(e) => e.currentTarget.style.display = 'none'} 
                        />
                    </div>
                    
                    <div className="flex-none text-sm text-muted mt-auto" style={{ paddingBottom: '1rem' }}>
                        © {new Date().getFullYear()} <span className="text-primary font-semibold">KERUBISCAN</span>. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
                <div className="login-card">
                    <div className="text-center mb-8">
                        <h2 className="title-main mb-3" style={{ fontSize: '1.875rem' }}>Connexion</h2>
                        <div className="divider-line"></div>
                        <p className="text-muted text-sm">
                            Accédez à votre tableau de bord <span className="text-primary font-semibold">KERUBISCAN</span>
                        </p>
                    </div>

                    {message !== undefined && (
                        <div 
                            className={`alert alert-${message.type} mb-6`} 
                            style={{ 
                                backgroundColor: message.type === 'error' ? '#fee2e2' : '#e0f2fe', 
                                color: message.type === 'error' ? '#991b1b' : '#075985', 
                                padding: '1rem', 
                                borderRadius: '0.375rem', 
                                marginBottom: '1.5rem', 
                                fontSize: '0.875rem',
                                textAlign: 'center'
                            }}
                        >
                            <span dangerouslySetInnerHTML={{ __html: message.summary }} />
                        </div>
                    )}

                    <form id="kc-form-login" onSubmit={() => true} action={url.loginAction} method="post" className="space-y-6">
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                Nom d'utilisateur ou email
                            </label>
                            <div className="input-wrapper">
                                <div className="input-icon-left">
                                    <User style={{ width: '1.25rem', height: '1.25rem' }} />
                                </div>
                                <input
                                    tabIndex={1}
                                    id="username"
                                    className="form-input"
                                    name="username"
                                    defaultValue={login.username ?? ""}
                                    type="text"
                                    autoFocus
                                    autoComplete="off"
                                    placeholder="Entrez votre nom d'utilisateur ou email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Mot de passe</label>
                            <div className="input-wrapper">
                                <div className="input-icon-left">
                                    <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                                </div>
                                <input
                                    tabIndex={2}
                                    id="password"
                                    className="form-input has-right-icon"
                                    name="password"
                                    type={isPasswordVisible ? "text" : "password"}
                                    autoComplete="off"
                                    placeholder="Entrez votre mot de passe"
                                />
                                <div 
                                    className="input-icon-right" 
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                >
                                    <Eye style={{ width: '1.25rem', height: '1.25rem', opacity: isPasswordVisible ? 1 : 0.5 }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-6">
                            {realm.rememberMe && !usernameHidden ? (
                                <label className="checkbox-wrapper">
                                    <input 
                                        tabIndex={3} 
                                        id="rememberMe" 
                                        name="rememberMe" 
                                        type="checkbox" 
                                        defaultChecked={!!login.rememberMe}
                                        className="form-checkbox" 
                                    />
                                    <span className="text-muted">Se souvenir de moi</span>
                                </label>
                            ) : <div></div>}
                            
                            {realm.resetPasswordAllowed && (
                                <a tabIndex={5} href={url.loginResetCredentialsUrl} className="link text-primary font-semibold hover:text-primary-hover">
                                    Mot de passe oublié ?
                                </a>
                            )}
                        </div>

                        <input
                            type="hidden"
                            id="id-hidden-input"
                            name="credentialId"
                            value={auth.selectedCredential !== undefined ? auth.selectedCredential : ""}
                        />
                        
                        <button
                            tabIndex={4}
                            className="btn-primary"
                            name="login"
                            id="kc-login"
                            type="submit"
                        >
                            Se connecter
                        </button>
                    </form>

                    {realm.password && (
                        <>
                            <div className="divider-container">
                                <div className="divider-line-bg">
                                    <div className="divider-line-inner"></div>
                                </div>
                                <div className="divider-text">
                                    <span>ou</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <a
                                    key="sso"
                                    id="social-sso"
                                    className="btn-outline"
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
                                    Se connecter avec SSO
                                </a>
                            </div>
                        </>
                    )}

                    {realm.password && realm.registrationAllowed && !registrationDisabled && (
                        <div className="mt-10 text-center text-sm text-muted">
                            Vous n'avez pas de compte ? <a tabIndex={6} href={url.registrationUrl} className="link text-primary font-semibold hover:text-primary-hover">Contactez l'administrateur</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
