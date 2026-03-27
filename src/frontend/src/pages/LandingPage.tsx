import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: AlertTriangle,
    title: "One-Touch SOS",
    desc: "Hold 3 seconds to instantly alert all trusted contacts with your live location.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: MapPin,
    title: "Live Location Sharing",
    desc: "Share real-time location with guardians. Stop anytime with one tap.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Danger Zone Detection",
    desc: "150+ mapped danger zones across India. Get alerts before entering risky areas.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Navigation,
    title: "Journey Tracking",
    desc: "Start a journey, set ETA. Get check-in reminders. Guardians stay informed.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Users,
    title: "Trusted Circle",
    desc: "Designate guardians from your contacts. They receive alerts and journey updates.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Zap,
    title: "Risk Intelligence",
    desc: "Real-time risk score based on your location, time of day, and nearby danger zones.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
];

const stats = [
  { value: "50,000+", label: "Women Protected" },
  { value: "1,200+", label: "Cities Covered" },
  { value: "150+", label: "Danger Zones Mapped" },
  { value: "24/7", label: "Emergency Support" },
];

const steps = [
  {
    num: "01",
    title: "Sign Up Securely",
    desc: "Login with Internet Identity — no passwords, no data leaks. Your privacy is guaranteed.",
  },
  {
    num: "02",
    title: "Add Trusted Contacts",
    desc: "Add family and friends as emergency contacts or guardians. They'll be notified in emergencies.",
  },
  {
    num: "03",
    title: "Stay Protected Always",
    desc: "With SOS, live tracking, danger zones, and safety tools — you're never truly alone.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    city: "Mumbai",
    text: "The SOS feature saved me when I was followed late at night. My family was notified instantly.",
    avatar: "P",
  },
  {
    name: "Ananya Reddy",
    city: "Hyderabad",
    text: "Journey mode gives my parents so much peace of mind. The check-in feature is brilliant.",
    avatar: "A",
  },
  {
    name: "Meera Patel",
    city: "Delhi",
    text: "Danger zone alerts helped me choose safer routes. This app is a must-have for every woman.",
    avatar: "M",
  },
];

const faqs = [
  {
    q: "Is my location data private?",
    a: "Yes. Your location is only shared with your chosen emergency contacts during an active SOS or journey. We never sell or share your data.",
  },
  {
    q: "How does the SOS alert work?",
    a: "Hold the SOS button for 3 seconds to trigger an alert. Your emergency contacts receive a message with your exact GPS location.",
  },
  {
    q: "Can I use this without internet?",
    a: "Core features require internet for real-time sharing. The app can be installed as a PWA for quick access. Emergency call numbers (112, 1091) always work.",
  },
  {
    q: "What are danger zones?",
    a: "Danger zones are mapped areas with high reported incidents, poor lighting, or isolation. The app warns you when you approach one.",
  },
  {
    q: "Is this app free?",
    a: "Yes, SafeHer India is completely free. Your safety shouldn't come with a price tag.",
  },
];

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/safeher-logo-transparent.dim_256x256.png"
              alt="SafeHer India"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-bold text-lg">
              SafeHer <span className="gradient-text">India</span>
            </span>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="bg-primary text-primary-foreground px-6"
            data-ocid="landing.login.button"
          >
            {isLoggingIn ? "Connecting..." : "Get Protected"}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
              <Shield className="w-3 h-3" /> India's Leading Women Safety
              Platform
            </span>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight mb-4">
              Your Personal{" "}
              <span className="gradient-text">Safety Companion</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
              SafeHer India empowers women with real-time SOS alerts, live
              location sharing, danger zone detection, and a trusted guardian
              network — always by your side.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                size="lg"
                className="bg-primary text-primary-foreground px-8 h-12 text-base font-semibold rounded-2xl"
                data-ocid="landing.hero.primary_button"
              >
                {isLoggingIn ? "Connecting..." : "Get Protected Now"}
              </Button>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 h-12 text-base rounded-2xl"
                  data-ocid="landing.hero.secondary_button"
                >
                  See Features
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-y border-border py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-muted-foreground mb-4 uppercase tracking-widest">
            Platform Metrics (Demo Data)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="font-display font-bold text-2xl md:text-3xl gradient-text">
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Stay Safe</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete safety ecosystem designed for real-world scenarios.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-card transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-card border-y border-border py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-bold text-2xl gradient-text">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-2">
              Trusted by Women{" "}
              <span className="gradient-text">Across India</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              (Demo testimonials for illustration)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &#8220;{t.text}&#8221;
                </p>
                <div className="flex gap-1 mt-3">
                  <span className="text-yellow-400 text-xs">★★★★★</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border-y border-border py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <Accordion
            type="single"
            collapsible
            className="space-y-2"
            data-ocid="landing.faq.panel"
          >
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="bg-background border border-border rounded-xl px-4"
              >
                <AccordionTrigger className="text-sm font-medium text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-3xl p-10">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display font-bold text-3xl mb-4">
              Start Your Safety Journey Today
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of women who trust SafeHer India for their daily
              safety.
            </p>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="lg"
              className="bg-primary text-primary-foreground px-10 h-12 text-base font-semibold rounded-2xl"
              data-ocid="landing.cta.primary_button"
            >
              {isLoggingIn ? "Connecting..." : "Get Protected Now — It's Free"}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img
                  src="/assets/generated/safeher-logo-transparent.dim_256x256.png"
                  alt="SafeHer India"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-display font-bold">
                  SafeHer <span className="gradient-text">India</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Personal Women Safety Companion. Empowering women across
                India.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: "Dashboard", href: "/" },
                  { label: "Map", href: "/map" },
                  { label: "Contacts", href: "/contacts" },
                  { label: "Safety Tools", href: "/tools" },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Emergency Numbers</p>
              <div className="space-y-2">
                {[
                  { label: "National Emergency", num: "112" },
                  { label: "Women Helpline", num: "1091" },
                  { label: "Ambulance", num: "102" },
                  { label: "Police", num: "100" },
                ].map((e) => (
                  <a
                    key={e.num}
                    href={`tel:${e.num}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {e.label}: <strong>{e.num}</strong>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SafeHer India. All rights reserved.
              Built with ❤️ for the safety of every woman.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              In emergency, always call <strong>112</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
