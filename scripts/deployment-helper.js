#!/usr/bin/env node

/**
 * Deployment Decision Helper
 * 
 * Interactive script to help you choose the best deployment option
 * based on your specific needs and constraints.
 */

const readline = require('readline');
const { execSync } = require('child_process');

class DeploymentHelper {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(type, message) {
    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ ',
      question: '❓'
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
  }

  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(`❓ ${question} `, resolve);
    });
  }

  async assessNeeds() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DEPLOYMENT DECISION HELPER');
    console.log('='.repeat(60));
    console.log('Let me help you choose the best deployment option.\n');

    const answers = {};

    // Time urgency
    answers.urgency = await this.ask('How urgent is deployment? (1=ASAP, 2=This week, 3=Can wait): ');
    
    // Risk tolerance
    answers.risk = await this.ask('Risk tolerance? (1=Low risk, 2=Medium, 3=High): ');
    
    // Technical complexity preference
    answers.complexity = await this.ask('Complexity preference? (1=Simple, 2=Balanced, 3=Full control): ');
    
    // Budget
    answers.budget = await this.ask('Monthly budget? (1=Free, 2=$5-20, 3=$20+): ');
    
    // Team size
    answers.team = await this.ask('Team size? (1=Solo, 2=Small team, 3=Large team): ');

    return answers;
  }

  analyzeAnswers(answers) {
    let netlifyScore = 0;
    let railwayScore = 0;
    let dockerScore = 0;

    // Urgency scoring
    if (answers.urgency === '1') {
      netlifyScore += 3; // Existing setup
      railwayScore += 2; // Quick migration
      dockerScore += 1; // More setup needed
    } else if (answers.urgency === '2') {
      netlifyScore += 2;
      railwayScore += 3;
      dockerScore += 2;
    } else {
      netlifyScore += 1;
      railwayScore += 2;
      dockerScore += 3;
    }

    // Risk tolerance
    if (answers.risk === '1') {
      netlifyScore += 2; // Known issues but fixes applied
      railwayScore += 3; // Proven to work with monorepos
      dockerScore += 1; // More moving parts
    } else if (answers.risk === '2') {
      netlifyScore += 2;
      railwayScore += 3;
      dockerScore += 2;
    } else {
      netlifyScore += 1;
      railwayScore += 2;
      dockerScore += 3;
    }

    // Complexity preference
    if (answers.complexity === '1') {
      netlifyScore += 1; // Complex setup
      railwayScore += 3; // Zero config
      dockerScore += 1; // Complex initially
    } else if (answers.complexity === '2') {
      netlifyScore += 2;
      railwayScore += 3;
      dockerScore += 2;
    } else {
      netlifyScore += 2;
      railwayScore += 2;
      dockerScore += 3;
    }

    // Budget
    if (answers.budget === '1') {
      netlifyScore += 3; // Free tier
      railwayScore += 1; // $5/month
      dockerScore += 2; // Varies by platform
    } else if (answers.budget === '2') {
      netlifyScore += 2;
      railwayScore += 3;
      dockerScore += 3;
    } else {
      netlifyScore += 2;
      railwayScore += 3;
      dockerScore += 3;
    }

    // Team size
    if (answers.team === '1') {
      netlifyScore += 1; // Complex for solo
      railwayScore += 3; // Simple for solo
      dockerScore += 2; // Manageable for solo
    } else if (answers.team === '2') {
      netlifyScore += 2;
      railwayScore += 3;
      dockerScore += 3;
    } else {
      netlifyScore += 3;
      railwayScore += 2;
      dockerScore += 3;
    }

    return {
      netlify: netlifyScore,
      railway: railwayScore,
      docker: dockerScore
    };
  }

  generateRecommendation(scores) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const winner = sorted[0];
    const runnerUp = sorted[1];

    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(60));
    
    console.log(`🥇 Primary Recommendation: ${winner[0].toUpperCase()} (Score: ${winner[1]})`);
    console.log(`🥈 Backup Option: ${runnerUp[0].toUpperCase()} (Score: ${runnerUp[1]})`);

    const recommendations = {
      netlify: {
        title: 'Netlify (Current Setup + Fixes)',
        pros: [
          '✅ Cross-env issue already fixed',
          '✅ All previous issues resolved',
          '✅ Free tier available',
          '✅ Familiar setup'
        ],
        cons: [
          '⚠️ Complex monorepo configuration',
          '⚠️ May encounter new issues',
          '⚠️ Requires ongoing maintenance'
        ],
        action: 'git add . && git commit -m "Apply fixes" && git push'
      },
      railway: {
        title: 'Railway (Zero Config Migration)',
        pros: [
          '✅ Zero configuration needed',
          '✅ Built-in PostgreSQL database',
          '✅ Excellent monorepo support',
          '✅ Predictable pricing ($5/month)',
          '✅ Simple environment management'
        ],
        cons: [
          '⚠️ Not free (but very affordable)',
          '⚠️ Newer platform (less community)'
        ],
        action: 'node scripts/migrate-to-railway.js'
      },
      docker: {
        title: 'Docker (Maximum Flexibility)',
        pros: [
          '✅ Works on any platform',
          '✅ Consistent environments',
          '✅ No vendor lock-in',
          '✅ Full control'
        ],
        cons: [
          '⚠️ More initial setup',
          '⚠️ Requires Docker knowledge',
          '⚠️ More moving parts'
        ],
        action: 'Create Dockerfile and deploy to platform of choice'
      }
    };

    const primary = recommendations[winner[0]];
    const backup = recommendations[runnerUp[0]];

    console.log(`\n🎯 ${primary.title}`);
    primary.pros.forEach(pro => console.log(`   ${pro}`));
    primary.cons.forEach(con => console.log(`   ${con}`));
    console.log(`\n📋 Action: ${primary.action}`);

    console.log(`\n🔄 Backup: ${backup.title}`);
    console.log(`📋 Action: ${backup.action}`);

    return { primary: winner[0], backup: runnerUp[0] };
  }

  async executeChoice(choice) {
    const confirm = await this.ask(`\nWould you like me to execute the ${choice.toUpperCase()} deployment now? (y/n): `);
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      console.log(`\n🚀 Executing ${choice.toUpperCase()} deployment...\n`);
      
      try {
        switch (choice) {
          case 'netlify':
            this.log('info', 'Netlify deployment requires manual steps:');
            this.log('info', '1. Commit changes: git add . && git commit -m "Apply deployment fixes"');
            this.log('info', '2. Push to repository: git push origin main');
            this.log('info', '3. Trigger deployment in Netlify dashboard');
            this.log('info', '4. Monitor build logs for success');
            break;
            
          case 'railway':
            execSync('node scripts/migrate-to-railway.js', { stdio: 'inherit' });
            break;
            
          case 'docker':
            this.log('info', 'Docker setup requires manual configuration:');
            this.log('info', '1. Review PROJECT_RESTRUCTURING_FOR_SIMPLE_DEPLOYMENT.md');
            this.log('info', '2. Create Dockerfile based on the guide');
            this.log('info', '3. Choose deployment platform (Railway, Render, Fly.io)');
            this.log('info', '4. Deploy container to chosen platform');
            break;
        }
        
        this.log('success', `${choice.toUpperCase()} deployment process initiated!`);
      } catch (error) {
        this.log('error', `Deployment failed: ${error.message}`);
      }
    } else {
      this.log('info', 'No problem! You can run the deployment manually when ready.');
    }
  }

  async run() {
    try {
      const answers = await this.assessNeeds();
      const scores = this.analyzeAnswers(answers);
      const recommendation = this.generateRecommendation(scores);
      
      await this.executeChoice(recommendation.primary);
      
    } catch (error) {
      this.log('error', `Helper failed: ${error.message}`);
    } finally {
      this.rl.close();
    }
  }
}

// CLI usage
if (require.main === module) {
  const helper = new DeploymentHelper();
  helper.run();
}

module.exports = { DeploymentHelper };