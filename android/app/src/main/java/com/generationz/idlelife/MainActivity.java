package com.generationz.idlelife;
import com.getcapacitor.BridgeActivity;
import android.content.Intent;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.*;
public class MainActivity extends BridgeActivity {
  private static final int EXPORT_REQUEST=12077;
  private boolean picker;
  private String exportText;
  @Override public void onCreate(Bundle state){super.onCreate(state);getBridge().getWebView().addJavascriptInterface(new FilesBridge(),"AndroidFiles");}
  private String message(String ru,String uk,String en){String language=getResources().getConfiguration().getLocales().get(0).getLanguage();return language.equals("ru")?ru:language.equals("uk")?uk:en;}
  public final class FilesBridge {
    @JavascriptInterface public void exportSave(String json){
      if(json==null||json.length()>1000000)return;
      try{new JSONObject(json);}catch(JSONException e){return;}
      runOnUiThread(()->{if(picker)return;exportText=json;picker=true;
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE,"generation-z-save.json");
        try{startActivityForResult(intent,EXPORT_REQUEST);}catch(Exception e){picker=false;exportText=null;notifyFileError();}
      });
    }
    @JavascriptInterface public void vibrate(String json){try{
      Object pattern=new JSONTokener(json).nextValue();long[] times;
      if(pattern instanceof JSONArray){JSONArray a=(JSONArray)pattern;times=new long[Math.min(12,a.length())+1];for(int i=1;i<times.length;i++)times[i]=Math.max(0,Math.min(100,a.optLong(i-1)));}
      else if(pattern instanceof Number)times=new long[]{0,Math.max(0,Math.min(100,((Number)pattern).longValue()))};else return;
      Vibrator vibrator=(Vibrator)getSystemService(VIBRATOR_SERVICE);if(vibrator!=null&&vibrator.hasVibrator()){if(times.length==2&&times[1]==0)vibrator.cancel();else vibrator.vibrate(VibrationEffect.createWaveform(times,-1));}
    }catch(Exception ignored){}}
  }
  private void notifyFileError(){Toast.makeText(this,message("Не удалось сохранить файл","Не вдалося зберегти файл","Could not save file"),Toast.LENGTH_LONG).show();}
  @Override protected void onActivityResult(int request,int result,Intent data){
    if(request!=EXPORT_REQUEST){super.onActivityResult(request,result,data);return;}
    if(result==RESULT_OK&&data!=null&&data.getData()!=null&&exportText!=null){
      try(OutputStream stream=getContentResolver().openOutputStream(data.getData())){if(stream==null)throw new IOException();stream.write(exportText.getBytes(StandardCharsets.UTF_8));}catch(IOException e){notifyFileError();}
    }exportText=null;picker=false;
  }
}
