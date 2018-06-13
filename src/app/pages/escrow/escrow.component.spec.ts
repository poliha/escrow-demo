import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EscrowComponent } from './escrow.component';

describe('EscrowComponent', () => {
  let component: EscrowComponent;
  let fixture: ComponentFixture<EscrowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EscrowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EscrowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
