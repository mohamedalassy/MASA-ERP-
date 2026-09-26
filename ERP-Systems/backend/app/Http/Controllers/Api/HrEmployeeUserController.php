<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HrEmployee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HrEmployeeUserController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        $q=User::query()->select('id','name','email','is_active')->where('is_active',true);
        if($request->filled('search')){
            $s=$request->string('search');
            $q->where(fn($x)=>$x->where('name','like',"%{$s}%")->orWhere('email','like',"%{$s}%"));
        }
        return response()->json(['success'=>true,'data'=>$q->orderBy('name')->limit(200)->get()]);
    }

    public function link(Request $request,HrEmployee $hrEmployee): JsonResponse
    {
        $data=$request->validate([
            'user_id'=>['nullable','integer','exists:users,id',
                Rule::unique('hr_employees','user_id')->ignore($hrEmployee->id)]
        ]);
        $hrEmployee->update(['user_id'=>$data['user_id']??null,'updated_by'=>$request->user()?->id]);
        return response()->json([
            'success'=>true,
            'message'=>empty($data['user_id'])?'تم إلغاء ربط حساب المستخدم.':'تم ربط حساب المستخدم بالموظف.',
            'data'=>$hrEmployee->fresh()->load('user:id,name,email,is_active')
        ]);
    }
}