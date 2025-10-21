import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Heart, Users, Search, Zap, CheckCircle, Star } from 'lucide-react';

export default function AboutPage() {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);
  const features = [
    {
      icon: Search,
      title: 'Series Search',
      description: 'Search through thousands of TV series using TMDB data',
    },
    {
      icon: Heart,
      title: 'Favorite Collections',
      description: 'Build your personal collection of favorite TV shows',
    },
    {
      icon: Users,
      title: 'Watch Rooms',
      description: 'Create rooms and invite friends for group recommendations',
    },
    {
      icon: Zap,
      title: 'AI-Powered Suggestions',
      description: 'Get personalized recommendations based on group preferences',
    },
  ];

  const benefits = [
    'Eliminates decision paralysis when choosing what to watch',
    'Helps groups discover new series everyone will enjoy',
    'Reduces conflicts and saves time in decision-making',
    'Provides data-driven recommendations using AI analysis',
    'Works with any group size - couples, friends, families',
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Badge
                variant="secondary"
                className="text-sm"
              >
                🎬 10x Series Matcher
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Find the Perfect Series for Your Group</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get personalized TV series recommendations based on everyone's tastes. No more endless debates or settling
              for shows nobody loves.
            </p>
          </div>

          {/* Problem Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">The Problem</CardTitle>
              <CardDescription>Choosing what to watch together shouldn't be this hard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-600">❌ Current Reality</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Endless discussions about what to watch</li>
                    <li>• Different tastes causing conflicts</li>
                    <li>• Information overload from streaming services</li>
                    <li>• Settling for shows nobody really enjoys</li>
                    <li>• Wasted time and ruined evenings</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-600">✅ Our Solution</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• AI analyzes everyone's preferences</li>
                    <li>• Personalized recommendations for groups</li>
                    <li>• Quick decision-making process</li>
                    <li>• Discover new shows everyone will love</li>
                    <li>• Happy evenings with perfect matches</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-2">Simple steps to perfect series recommendations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <CardTitle className="text-lg">Create Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sign up and build your personal collection of favorite TV series
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <CardTitle className="text-lg">Create Room</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Start a watch room and invite your friends to join</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <CardTitle className="text-lg">Share Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Each person adds their favorite series to the room</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">4</span>
                  </div>
                  <CardTitle className="text-lg">Get Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">AI analyzes preferences and suggests perfect matches</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Features</h2>
              <p className="text-muted-foreground mt-2">Everything you need for perfect group recommendations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Benefits
              </CardTitle>
              <CardDescription>Why groups love using 10x Series Matcher</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-4 bg-primary/5 rounded-lg p-8">
            <h2 className="text-2xl font-bold">Ready to find your next favorite series?</h2>
            <p className="text-muted-foreground">
              Join thousands of groups who have discovered their perfect shows with 10x Series Matcher
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2"
              >
                🚀 Free to use
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2"
              >
                👥 Unlimited group size
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2"
              >
                🎯 AI-powered recommendations
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
