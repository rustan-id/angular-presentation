import { Input, OnDestroy } from '@angular/core';
import { ExerciseConfig } from '../interfaces/exercise-config';
import { MonacoConfigService } from 'app/exercise/services/monaco-config.service';
import { SlideComponent } from '../../presentation/slide/slide.component';
import { Subscription } from 'rxjs/Subscription';
import { AnalyticsService } from '../../presentation/analytics.service';
import { ActivatedRoute } from '@angular/router';
import { PresentationComponent } from '../../presentation/presentation/presentation.component';

export class ExerciseBase implements OnDestroy {
  @Input() public config: ExerciseConfig;
  running = false;
  solved = false;
  private onActiveUnsubscribe: Subscription;


  loadModels() {
    this.monacoConfig.createFileModels(this.config.files);
  }

  ngOnDestroy(): void {
    this.onActiveUnsubscribe.unsubscribe();
  }

  onTestUpdate(event) {
    if (!event.data || !event.data.type) {
      return;
    }

    if (event.data.type === 'testList') {
      this.config.tests = event.data.tests.map(test => ({
        title: test
      }));
    }

    if (event.data.type === 'testEnd') {
      if (this.config.tests.length && this.config.tests.every(test => test.pass)) {
        const path = this.route.parent.snapshot.routeConfig && this.route.parent.snapshot.routeConfig.path || 'index';
        this.analyticsService.sendEvent('exercise', 'solved', path);
        this.solved = true;
      }
      this.running = false;
    }

    if (event.data.type === 'testResult') {
      this.config.tests = this.config.tests.map(test => {
        if (test.title === event.data.test.title) {
          test.pass = event.data.pass;
          test.result = event.data.result;
        }
        return test;
      });
    }
  }

  goToNextSlide() {
    this.presentation.nextSlide();
  }

  toggleFile(toggledFile) {
    this.config = {
      ...this.config,
      files: this.config.files.map(file => file === toggledFile ? {...file, collapsed: !file.collapsed} : file)
    };
  }

  loadSolution(solutionFile) {
    this.config = {
      ...this.config,
      files: this.config.files.map(file => file === solutionFile ? {...file, code: file.solution} : file)
    };
  }

  onCodeChanges(change) {
    this.config = {
      ...this.config,
      files: this.config.files.map(file => file === change.file ? {...file, code: change.code} : file)
    };
  }

  constructor(public slide: SlideComponent,
              private monacoConfig: MonacoConfigService,
              private analyticsService: AnalyticsService,
              private route: ActivatedRoute,
              private presentation: PresentationComponent) {
    this.onActiveUnsubscribe = slide.onActive.filter(a => a).subscribe(() => {
      console.log('ACTIVE');
      slide.disableResize();
      this.loadModels();
    });
  }
}
