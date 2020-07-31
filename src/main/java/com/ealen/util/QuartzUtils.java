package com.ealen.util;

import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.Map;

/**
 * 
 * 
 * @description: TODO squartz 常用工具
 * @author james
 * @since 2017年7月31日 上午11:56:43 
 * @version 
 *
 */
@Component
public class QuartzUtils {
	public static String convertBigIntegerToDateStr(BigInteger bd) {
		String date = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date(bd.longValue()));
		return date;
	}

	public static String convertState(String str) {
		Map<String, String> status = new HashMap<String, String>();
		status.put("ACQUIRED", "运行中");
		status.put("PAUSED", "暂停中");
		status.put("WAITING", "等待中");
		return (String) status.get(str);
	}

	public static String splitName(String str) {
		int ix = str.indexOf("_");
		if (ix != -1) {
			return str.substring(0, ix);
		} else {
			return str;
		}
	}

	// TODO 输出调试信息

	public static boolean is_info = true;
	public static boolean is_err = true;

	/** 输出普通信息 */
	public static void info(Object... os) {
		if (is_info)
			out("消息", os);
	}

	/** 输出错误信息 */
	public static void err(Object... os) {
		if (is_info)
			out("错误", os);
	}

	/** 输出信息 */
	public static void out(Object pre, Object[] os) {
		StringBuilder sb = new StringBuilder();
		sb.append(pre);
		if (os != null && os.length > 0) {
			sb.append(':');
			for (int i = 0; i < os.length; i++) {
				sb.append(os[i]).append(',');
			}
			sb.setLength(sb.length() - 1);
		}
		System.out.println(sb);
	}


}
