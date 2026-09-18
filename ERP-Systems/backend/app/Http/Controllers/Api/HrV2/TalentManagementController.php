<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;
use App\Models\HrGoal;use App\Models\HrGoalCycle;use App\Models\HrPerformanceReview;use App\Models\HrReviewCycle;
use App\Models\HrSkill;use App\Models\HrEmployeeSkill;use App\Models\HrLearningEnrollment;use App\Models\HrSuccessionPlan;
class TalentManagementController extends Controller {
 public function performance(){
  return response()->json([
   'active_goal_cycles'=>HrGoalCycle::where('status','active')->count(),
   'active_goals'=>HrGoal::where('status','active')->count(),
   'active_review_cycles'=>HrReviewCycle::whereIn('status',['active','calibration'])->count(),
   'pending_reviews'=>HrPerformanceReview::whereIn('status',['pending','in_progress'])->count(),
   'goals'=>HrGoal::with('employee:id,first_name,last_name')->latest()->limit(30)->get(),
   'reviews'=>HrPerformanceReview::with('employee:id,first_name,last_name')->latest()->limit(20)->get()
  ]);
 }
 public function learning(){
  return response()->json([
   'skills'=>HrSkill::where('is_active',true)->count(),
   'skill_gaps'=>HrEmployeeSkill::whereColumn('level','<','target_level')->count(),
   'active_enrollments'=>HrLearningEnrollment::whereIn('status',['assigned','enrolled','in_progress'])->count(),
   'completed'=>HrLearningEnrollment::where('status','completed')->count(),
   'enrollments'=>HrLearningEnrollment::with(['employee:id,first_name,last_name','course:id,title'])->latest()->limit(30)->get()
  ]);
 }
 public function succession(){
  return response()->json(HrSuccessionPlan::with(['candidates.employee:id,first_name,last_name'])->latest()->get());
 }
}