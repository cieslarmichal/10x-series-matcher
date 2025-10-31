import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Heart, Users, BrainCircuit, PartyPopper } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="animate-fade-in space-y-20 sm:space-y-32">
            {/* Hero Section */}
            <div className="text-center pt-12">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tighter">
                Never argue about what to watch again
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground font-light tracking-tight max-w-4xl mx-auto mb-10">
                Find the perfect TV series for you and your friends. Rate your favorite shows, create watch rooms, and
                let our AI find the perfect match for your group.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/login?tab=register')}
                  className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  Get Started for Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="border-border hover:bg-accent w-full sm:w-auto"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
                <p className="text-lg text-muted-foreground mt-3">
                  Finding the perfect show for your group is as easy.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">1. Build Your Profile</h3>
                  <p className="text-muted-foreground">Rate your favorite TV shows to create a taste profile.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">2. Create a Room</h3>
                  <p className="text-muted-foreground">Start a watch room and invite your friends to join.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <PartyPopper className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">3. Get Matches</h3>
                  <p className="text-muted-foreground">
                    Our AI analyzes everyone's taste and suggests the perfect show.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Key Features</h2>
                <p className="text-lg text-muted-foreground mt-3">Everything you need to make movie night a success.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-6 border-2">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">AI-Powered Recommendations</h3>
                      <p className="text-muted-foreground mt-1">
                        Leverage the power of AI to get unbiased recommendations based on your group's unique taste.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-2">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Seamless Group Collaboration</h3>
                      <p className="text-muted-foreground mt-1">
                        Easily invite friends and combine your taste profiles to find the perfect match for everyone.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to find your next favorite show?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Sign up for free and say goodbye to endless scrolling and debates.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/login?tab=register')}
                className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started for Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
