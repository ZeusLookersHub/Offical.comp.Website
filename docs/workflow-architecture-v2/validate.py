"""Validate the proposed design, not the running application or generated images."""
from pathlib import Path
import copy,json,re,unittest
ROOT=Path(__file__).resolve().parents[2]
MODEL=Path(__file__).with_name('architecture.json')
CONDITIONS={'always','quality-passed','missing-or-conflicting-fact','user-revision'}

def validate_model(d):
 errors=[]
 def issue(code):errors.append(code)
 def unique(items,key,code):
  ids=[x[key]for x in items]
  if len(ids)!=len(set(ids)):issue(code)
 unique(d['categories'],'id','category:duplicate');unique(d['topics'],'id','topic:duplicate');unique(d['patterns'],'id','pattern:duplicate');unique(d['blueprints'],'id','blueprint:duplicate');unique(d['links'],'id','link:duplicate')
 categories={x['id']:x for x in d['categories']};topics={x['id']:x for x in d['topics']};patterns={x['id']:x for x in d['patterns']};blueprints={x['id']:x for x in d['blueprints']}
 modules={m['id']:m for m in d['sharedModules']}
 unique(d['sharedModules'],'id','module:duplicate')
 for m in modules.values():
  if m['askWhen']!='missing-and-relevant' or m['doNotInfer']is not True:issue('module:repetition-or-inference')
  if not all(m.get(k,{}).get(lang) for k in ['question','why','example'] for lang in ['ar','en']):issue('module:localized-help')
 for b in blueprints.values():
  if any(m not in modules for m in b['nodes'][1]['modules']):issue('module:unresolved')
 branches={};leaves=[]
 for cat in categories.values():
  for branch in cat['branches']:
   if branch['id']in branches:issue('branch:duplicate')
   branches[branch['id']]=cat['id'];leaves+=branch['topics']
 if len(leaves)!=len(set(leaves))or set(leaves)!=set(topics):issue('taxonomy:leaf-coverage')
 raw=(ROOT/'services/lookersAiTopicRegistry.ts').read_text().split('export type TopicEntry')[0]
 actual={}
 for m in re.finditer(r"\s*(?:'([^']+)'|([a-z]+)):\s*'([^']+)'",raw):
  for t in m[3].split():actual[t]=m[1]or m[2]
 if set(actual)!=set(topics):issue('taxonomy:runtime-coverage')
 for t in topics.values():
  if branches.get(t['branchId'])!=t['categoryId']:issue('topic:parent')
  if t['runtimeFamily']!=actual.get(t['id']):issue('topic:family')
  p=patterns.get(t['patternId'])
  if not p or t['runtimeFamily']not in p['reusedBy']:issue('topic:pattern')
 for b in blueprints.values():
  if b['status']!='design-not-connected' or b['output']['kind']!='prompt-brief':issue('blueprint:scope')
  if b['patternId']not in patterns:issue('blueprint:pattern')
  for t in b['primaryTopics']:
   if t not in topics or topics[t]['runtimeFamily']!=b['family']:issue('blueprint:topic')
  nodes={x['id']:x for x in b['nodes']};unique(b['nodes'],'id','node:duplicate')
  adjacency={k:[]for k in nodes}
  for edge in b['edges']:
   if edge['from']not in nodes or edge['to']not in nodes:issue('edge:unresolved');continue
   if edge['condition']not in CONDITIONS:issue('edge:condition')
   if edge.get('kind')=='return':
    if not isinstance(edge.get('maxPasses'),int)or not 1<=edge['maxPasses']<=3:issue('edge:unbounded-return')
   else:adjacency[edge['from']].append(edge['to'])
  visiting=set();visited=set()
  def walk(node):
   if node in visiting:issue('edge:cycle');return
   if node in visited:return
   visiting.add(node)
   for target in adjacency.get(node,[]):walk(target)
   visiting.remove(node);visited.add(node)
  walk('brief')
  if visited!=set(nodes):issue('graph:unreachable')
  if [n for n,targets in adjacency.items()if not targets]!=['review']:issue('graph:terminal')
  quality=nodes.get('quality',{})
  if quality.get('role')!='decision' or not {'intent-retained','no-invented-facts','exact-text-policy','execution-metadata-separated','output-contract-met'}.issubset(quality.get('checks',[])):issue('quality:missing-gate')
  if not any(e['from']=='quality'and e['to']=='package'and e['condition']=='quality-passed'for e in b['edges']):issue('quality:unguarded-output')
 for link in d['links']:
  a,b=blueprints.get(link['from']),blueprints.get(link['to'])
  if not a or not b:issue('link:unresolved');continue
  if link['autoExecute']or not link['requiresUserSelection']or link['kind']!='manual-context-handoff':issue('link:scope')
  accept=next((x for x in b['contextInputs']if x['fromBlueprint']==a['id']and x['contract']==link['contract']),None)
  if not accept or accept['kind']!=a['output']['kind']or accept['version']!=a['output']['schemaVersion']:issue('link:contract');continue
  if set(link['fields'])!=set(accept['fields']):issue('link:fields')
  for f in link['fields']:
   if a['output']['fields'].get(f)!=accept['fields'].get(f):issue('link:type')
  if not link['forbidUnreviewedGeneratedFacts']or set(link['acceptedProvenance'])!={'user-confirmed','cited-source'}:issue('link:provenance')
 if d['runtimeIntegrated']is not False:issue('scope:runtime-claim')
 return sorted(set(errors))

def validate_visual_payload(request,payload):
 """A deterministic specification contract; this does not inspect rendered pixels."""
 errors=[];content=payload['content'];execution=payload['execution']
 allowed=request['allowedText']if request['textPolicy']=='exact'else[]
 for item in content['renderedText']:
  if item['value']not in allowed:errors.append('unrequested-or-altered-text')
  if item.get('role')=='brand'and item['value']!=request['exactBrandName']:errors.append('brand-spelling')
 if execution!=request['execution']:errors.append('execution-changed')
 if request.get('referenceRequired')and not content.get('referenceAsset'):errors.append('missing-reference')
 if content['renderedText']and not request['textConfirmed']:errors.append('unconfirmed-copy')
 return sorted(set(errors))

class ArchitectureContracts(unittest.TestCase):
 def setUp(self):self.d=json.loads(MODEL.read_text())
 def test_complete_design(self):self.assertEqual(validate_model(self.d),[])
 def test_runtime_coverage(self):self.assertEqual(len(self.d['topics']),138)
 def test_duplicate_topic_rejected(self):self.d['topics'].append(copy.deepcopy(self.d['topics'][0]));self.assertIn('topic:duplicate',validate_model(self.d))
 def test_orphan_branch_rejected(self):self.d['topics'][0]['branchId']='missing';self.assertIn('topic:parent',validate_model(self.d))
 def test_wrong_family_rejected(self):self.d['topics'][0]['runtimeFamily']='research';self.assertIn('topic:family',validate_model(self.d))
 def test_wrong_pattern_rejected(self):self.d['topics'][0]['patternId']='missing';self.assertIn('topic:pattern',validate_model(self.d))
 def test_unknown_node_rejected(self):self.d['blueprints'][0]['edges'][0]['to']='missing';self.assertIn('edge:unresolved',validate_model(self.d))
 def test_unreachable_node_rejected(self):self.d['blueprints'][0]['nodes'].append({'id':'orphan'});self.assertIn('graph:unreachable',validate_model(self.d))
 def test_accidental_cycle_rejected(self):self.d['blueprints'][0]['edges'].append({'from':'work-2','to':'work-1','condition':'always'});self.assertIn('edge:cycle',validate_model(self.d))
 def test_unbounded_revision_rejected(self):self.d['blueprints'][0]['edges'][-1]['maxPasses']=0;self.assertIn('edge:unbounded-return',validate_model(self.d))
 def test_executable_condition_rejected(self):self.d['blueprints'][0]['edges'][0]['condition']='eval(userInput)';self.assertIn('edge:condition',validate_model(self.d))
 def test_unguarded_output_rejected(self):self.d['blueprints'][0]['edges'][5]['condition']='always';self.assertIn('quality:unguarded-output',validate_model(self.d))
 def test_autonomous_handoff_rejected(self):self.d['links'][0]['autoExecute']=True;self.assertIn('link:scope',validate_model(self.d))
 def test_unreviewed_fact_handoff_rejected(self):self.d['links'][0]['forbidUnreviewedGeneratedFacts']=False;self.assertIn('link:provenance',validate_model(self.d))
 def test_port_type_mismatch_rejected(self):self.d['blueprints'][0]['contextInputs'][0]['fields']['brand.exactName']='array';self.assertIn('link:type',validate_model(self.d))
 def test_port_version_mismatch_rejected(self):self.d['blueprints'][0]['contextInputs'][0]['version']=2;self.assertIn('link:contract',validate_model(self.d))
 def test_unknown_module_rejected(self):self.d['blueprints'][0]['nodes'][1]['modules'].append('missing');self.assertIn('module:unresolved',validate_model(self.d))
 def test_missing_help_language_rejected(self):self.d['sharedModules'][0]['why']['ar']='';self.assertIn('module:localized-help',validate_model(self.d))
 def test_repeated_question_policy_rejected(self):self.d['sharedModules'][0]['askWhen']='always';self.assertIn('module:repetition-or-inference',validate_model(self.d))
 def test_runtime_claim_rejected(self):self.d['runtimeIntegrated']=True;self.assertIn('scope:runtime-claim',validate_model(self.d))

class VisualPromptRegressions(unittest.TestCase):
 def setUp(self):
  self.request={'textPolicy':'exact','allowedText':['DAVIDOFF'],'exactBrandName':'DAVIDOFF','textConfirmed':True,'referenceRequired':True,'execution':{'aspectRatio':'9:16','targetTool':'image-tool'}}
  self.payload={'content':{'renderedText':[{'role':'brand','value':'DAVIDOFF'}],'referenceAsset':'approved-product-reference'},'execution':copy.deepcopy(self.request['execution'])}
 def test_correct_literal_brand(self):self.assertEqual(validate_visual_payload(self.request,self.payload),[])
 def test_ratio_not_scene_copy(self):self.payload['content']['renderedText'].append({'value':'9:16'});self.assertIn('unrequested-or-altered-text',validate_visual_payload(self.request,self.payload))
 def test_platform_not_watermark(self):self.payload['content']['renderedText'].append({'value':'Lookers AI'});self.assertIn('unrequested-or-altered-text',validate_visual_payload(self.request,self.payload))
 def test_wrong_brand_rejected(self):self.payload['content']['renderedText'][0]['value']='DAVIE DOVE';self.assertIn('brand-spelling',validate_visual_payload(self.request,self.payload))
 def test_invented_transliteration_rejected(self):self.payload['content']['renderedText'][0]['value']='ديفي دوف';self.assertIn('brand-spelling',validate_visual_payload(self.request,self.payload))
 def test_case_change_rejected(self):self.payload['content']['renderedText'][0]['value']='Davidoff';self.assertIn('brand-spelling',validate_visual_payload(self.request,self.payload))
 def test_unrequested_tagline_rejected(self):self.payload['content']['renderedText'].append({'value':'استكشف القوة'});self.assertIn('unrequested-or-altered-text',validate_visual_payload(self.request,self.payload))
 def test_missing_identity_reference_rejected(self):self.payload['content']['referenceAsset']='';self.assertIn('missing-reference',validate_visual_payload(self.request,self.payload))
 def test_no_text_mode(self):self.request['textPolicy']='none';self.payload['content']['renderedText']=[];self.assertEqual(validate_visual_payload(self.request,self.payload),[])
 def test_unconfirmed_text_rejected(self):self.request['textConfirmed']=False;self.assertIn('unconfirmed-copy',validate_visual_payload(self.request,self.payload))
 def test_execution_override_rejected(self):self.payload['execution']['aspectRatio']='16:9';self.assertIn('execution-changed',validate_visual_payload(self.request,self.payload))

if __name__=='__main__':unittest.main(verbosity=2)
