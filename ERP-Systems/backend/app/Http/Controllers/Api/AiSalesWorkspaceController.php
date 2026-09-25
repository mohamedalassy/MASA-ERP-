<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    AiSalesContact,
    AiSalesTask,
    AiSalesCommunication,
    AiSalesTender,
    AiSalesPlaybook,
    AiSalesSetting,
    Product
};
use Illuminate\Http\Request;

class AiSalesWorkspaceController extends Controller
{
    public function contacts(Request $r)
    {
        return response()->json(AiSalesContact::with('company')->latest()->paginate(25));
    }

    public function storeContact(Request $r)
    {
        $d=$r->validate([
            'company_id'=>'required|exists:ai_sales_companies,id','name'=>'required|string|max:255',
            'job_title'=>'nullable|string|max:255','email'=>'nullable|email','phone'=>'nullable|string|max:50',
            'is_decision_maker'=>'nullable|boolean','confidence'=>'nullable|integer|min:0|max:100',
            'source'=>'nullable|string|max:120'
        ]);
        return response()->json(AiSalesContact::create($d),201);
    }

    public function tasks()
    {
        return response()->json(AiSalesTask::with('company')->orderBy('due_at')->paginate(25));
    }

    public function storeTask(Request $r)
    {
        $d=$r->validate([
            'company_id'=>'nullable|exists:ai_sales_companies,id','lead_id'=>'nullable|exists:ai_sales_leads,id',
            'opportunity_id'=>'nullable|exists:ai_sales_opportunities,id','type'=>'nullable|string|max:80',
            'title'=>'required|string|max:255','description'=>'nullable|string',
            'status'=>'nullable|in:open,in_progress,done,cancelled','priority'=>'nullable|in:low,medium,high,urgent',
            'due_at'=>'nullable|date','assigned_to'=>'nullable|exists:users,id'
        ]);
        return response()->json(AiSalesTask::create($d),201);
    }

    public function communications()
    {
        return response()->json(AiSalesCommunication::with('company')->latest()->paginate(25));
    }

    public function storeCommunication(Request $r)
    {
        $d=$r->validate([
            'company_id'=>'nullable|exists:ai_sales_companies,id','lead_id'=>'nullable|exists:ai_sales_leads,id',
            'contact_id'=>'nullable|exists:ai_sales_contacts,id',
            'channel'=>'required|in:email,phone,whatsapp,sms,meeting,other',
            'direction'=>'nullable|in:inbound,outbound','subject'=>'nullable|string|max:255',
            'body'=>'nullable|string','status'=>'nullable|in:draft,queued,sent,delivered,replied,failed',
            'metadata'=>'nullable|array'
        ]);
        return response()->json(AiSalesCommunication::create($d),201);
    }

    public function tenders(){return response()->json(AiSalesTender::orderByDesc('fit_score')->paginate(25));}
    public function storeTender(Request $r){
        $d=$r->validate(['title'=>'required|string|max:255','issuer'=>'nullable|string|max:255',
        'reference'=>'nullable|string|max:120','industry'=>'nullable|string|max:255','region'=>'nullable|string|max:120',
        'estimated_value'=>'nullable|numeric|min:0','currency'=>'nullable|string|size:3','deadline'=>'nullable|date',
        'fit_score'=>'nullable|integer|min:0|max:100','status'=>'nullable|string|max:80','source'=>'nullable|string|max:120',
        'source_url'=>'nullable|string|max:2048','matched_items'=>'nullable|array','requirements'=>'nullable|array']);
        return response()->json(AiSalesTender::create($d),201);
    }

    public function playbooks(){return response()->json(AiSalesPlaybook::latest()->get());}
    public function storePlaybook(Request $r){
        $d=$r->validate(['name'=>'required|string|max:255','trigger_type'=>'nullable|string|max:100',
        'description'=>'nullable|string','steps'=>'nullable|array','is_active'=>'nullable|boolean']);
        return response()->json(AiSalesPlaybook::create($d),201);
    }

    public function catalog(){return response()->json(Product::where('is_active',true)->select('id','sku','name','category','brand','description','default_sale_price')->orderBy('name')->get());}
    public function settings(){return response()->json(AiSalesSetting::orderBy('group')->get());}
    public function saveSetting(Request $r){
        $d=$r->validate(['key'=>'required|string|max:150','value'=>'nullable','group'=>'nullable|string|max:100']);
        return response()->json(AiSalesSetting::updateOrCreate(['key'=>$d['key']],['value'=>$d['value']??null,'group'=>$d['group']??'general']));
    }
}
